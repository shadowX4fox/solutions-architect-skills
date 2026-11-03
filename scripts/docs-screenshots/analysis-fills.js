// the analysis fills behind docs/images/analysis/: a SPOF report with a heat map and a latency report whose flow runs over
// its target, for the synthetic Order Desk showcase; then the same latency report with one hop raised to critical, for the
// verdict picture. bun analysis-fills.js <dir> → spof.fill.json, latency.fill.json, latency-raised.fill.json
const fs=require('fs'),S=process.argv[2]||'.';
const proj={name:"Order Desk — Architecture",version:"1.2.0",status:"Released",source:"ARCHITECTURE.md"};
const base=(lens)=>({lens,language:"en",today:"2026-11-02",project:proj,citations:["ARCHITECTURE.md","docs/05-integration-points.md"]});
fs.writeFileSync(S+'/spof.fill.json',JSON.stringify({...base("spof"),
 summary:["Order DB and API Gateway each run as one instance on the order path.","Hub API is a partner dependency with no fallback documented."],
 sections:{
  "Critical SPOFs":{rows:[
   {id:"C1",cells:{Component:"`Order DB`",["Failure Scenario"]:"Primary node lost",Impact:"No order can be placed or read",["Current Mitigation"]:"None documented"}},
   {id:"C2",cells:{Component:"`API Gateway`",["Failure Scenario"]:"Single replica crashes",Impact:"Web App loses every API",["Current Mitigation"]:"Restart by the orchestrator"}}]},
  "Degradation SPOFs":{rows:[
   {id:"D1",cells:{Component:"`Outbox Relay`",["Failure Scenario"]:"Worker stalls",Impact:"Settlement delayed; orders still accepted",["Current Mitigation"]:"Outbox keeps events"}},
   {id:"D2",cells:{Component:"`Hub API`",["Failure Scenario"]:"Partner unavailable",Impact:"Payments queue up",["Current Mitigation"]:"None documented"}}]},
  "Operational SPOFs":{rows:[
   {id:"O1",cells:{Component:"`Order Service`",["Failure Scenario"]:"One deploy pipeline, no rollback stated",Impact:"A bad release stays live"}}]}},
 heatmap:[{id:"C1",x:2,y:3},{id:"C2",x:3,y:3},{id:"D1",x:2,y:2},{id:"D2",x:3,y:2},{id:"O1",x:1,y:2}],
 recommendations:[{id:"C1",title:"Add a standby for Order DB",body:"A synchronous replica with automatic failover.",source:"docs/09 § 11.5"},{id:"C2",title:"Run API Gateway with two replicas",body:"Behind the load balancer already in the deployment view.",source:"docs/08"}],
 verdict:"Two critical single points on the order path; both are fixed by redundancy the platform already offers.",
 gaps:[{subject:"`Order DB`",missing:"RTO and RPO",where:"docs/09 § 11.5"}]}));
fs.writeFileSync(S+'/latency.fill.json',JSON.stringify({...base("latency-budget"),
 summary:["Place an order runs at 480 ms p95 against a 400 ms target.","Order Service carries most of the overage."],
 sections:{
  "Per-Flow Budget Breakdown":{blocks:[
   {title:"Flow 1 — Place an order (target ≤ 400 ms)",text:"Three phases; one hop over its share.",table:{columns:["Hop #","Component","p95 (ms)","Status"],rows:[["1","`Web App`","60","within"],["2","`API Gateway`","40","within"],["3","`Order Service`","230","over"],["4","`Order DB`","90","tight"],["5","`Fraud Screen`","60","within"]]}},
   {title:"Flow 2 — Settle (target ≤ 2 s)",text:"Asynchronous; within budget.",table:{columns:["Hop #","Component","p95 (ms)","Status"],rows:[["1","`Outbox Relay`","300","within"],["2","`Hub API`","700","within"],["3","`Hub Ledger`","Not documented","untracked"]]}}]},
  "Hops Over Budget":{rows:[{id:"OB-01",cells:{Flow:"Place an order","Hop #":"3",Component:"`Order Service`","p95 (ms)":"230","Proportional Share (ms)":"150","Overage (ms)":"80",Severity:"High"}}]},
  "Tail-Latency Hotspots":{rows:[{id:"TL-01",cells:{Component:"`Order DB`","Flow(s)":"Place an order","p95 (ms)":"90","p99 (ms)":"260","p99/p95 Ratio":"2.9","Risk":"Medium"}}]}},
 recommendations:[{id:"OB-01",title:"Cache the catalogue read in Order Service",body:"Removes one Order DB round trip per order.",source:"docs/04 § Phase 3"}],
 verdict:"One flow over target by 80 ms, all of it in one hop.",
 gaps:[{subject:"`Hub Ledger`",missing:"p95",where:"docs/06"}]}));
const raised = JSON.parse(fs.readFileSync(S + '/latency.fill.json', 'utf8'));
raised.today = '2026-11-03';
raised.sections['Per-Flow Budget Breakdown'].blocks[0].table.rows[3] = ['4', '`Order DB`', '140', 'over'];
raised.sections['Hops Over Budget'].rows.push({ id: 'OB-02', cells: { Flow: 'Place an order', 'Hop #': '4', Component: '`Order DB`', 'p95 (ms)': '140', 'Proportional Share (ms)': '80', 'Overage (ms)': '60', Severity: 'Critical' } });
fs.writeFileSync(S + '/latency-raised.fill.json', JSON.stringify(raised));
