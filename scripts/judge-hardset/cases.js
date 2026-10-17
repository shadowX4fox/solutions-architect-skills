// The judge's hard set (8.133.0): 48 labelled items over four of the plugin's judged sites (the compliance site left with compliance), written to break a judge —
// Spanish negation and deferral, a product name in the
// Protocol cell, a pull, a command on a queue, a transport / qualifier / alias / team in a name cell, planned against
// present, history against assertion. Every name is invented. Each site's spec is its code's, verbatim — `cases.test.ts`
// holds them to the source — and the labels live here only, never in the state the judge sees.
// Run: bun scripts/judge-hardset/run.js [--engine haiku,typesafe,clef] — the measurements are in docs/DESIGN_NOTES.md § Judge.
'use strict';
const SITES = {};

// ── B. edge-direction (plugins/sa-analysis/.../analysis-prepare.js EDGE_DIRECTION)
const row = (from, to, protocol, pattern, label, mode) => ({ state: { from, to, protocol, pattern, boundary: 'Internal' }, label, mode });
SITES.direction = {
  spec: { id: 'edge-direction', type: 'choice', hi: 0.6,
    question: 'In which direction does the integration row `item` run? `item.from` and `item.to` are the two components; `item.protocol` and `item.pattern` describe the interaction between them.',
    criteria: {
      call: 'From invokes To and waits for the answer: a request-response, a query, a command, an RPC, a synchronous API call over any transport. From depends on To. A product name in the Protocol cell (a "Sync Gateway", an "Event Hub", a "Stream Manager") does not make the row an event or a replication; the Pattern cell decides.',
      data: 'From produces what To consumes: an event published to a topic, a message on a queue, a replication or CDC feed, a stream, a webhook delivered to To, or a pull in which To fetches data that From holds. To depends on From.',
      unclear: 'The Pattern and Protocol cells do not say which of the two it is.',
    } },
  cases: [
    row('Order Desk', 'Hub API', 'HTTPS via Sync Gateway', 'Request-response', 'call', 'product-name'),
    row('Hub API', 'Pricing Engine', 'AMQP over Event Hub', 'Request-reply: waits for the price on a reply queue', 'call', 'product-name'),
    row('Pricing Engine', 'Hub API', 'Stream Manager (HTTP/2)', 'Synchronous query', 'call', 'product-name'),
    row('Hub API', 'Notify Worker', 'Kafka', 'Publishes OrderPlaced to topic order-events', 'data', 'plain'),
    row('Ledger Store', 'Report Warehouse', 'Debezium CDC', 'Change data capture feed', 'data', 'plain'),
    row('Hub API', 'Partner Portal', 'HTTPS webhook', 'Webhook delivered on order status change', 'data', 'plain'),
    row('Ledger Store', 'Reconciler', 'SFTP', 'Reconciler fetches the nightly settlement file that Ledger Store writes', 'data', 'pull'),
    row('Order Desk', 'Catalog Service', 'gRPC', 'Unary call', 'call', 'plain'),
    row('Hub API', 'Audit Store', 'HTTPS', 'Not documented', 'unclear', 'empty-pattern'),
    row('Order Desk', 'Fraud Scorer', 'Embedded SDK', 'Integration', 'unclear', 'vague'),
    row('Portal Comercial', 'API de Pagos', 'HTTPS/JSON', 'Consulta síncrona del estado del pago', 'call', 'es'),
    row('API de Pagos', 'Motor de Notificaciones', 'RabbitMQ', 'Publicación de eventos de pago confirmado', 'data', 'es'),
    row('Ledger Store', 'Réplica de Lectura', 'Replicación nativa', 'Replicación asíncrona nocturna', 'data', 'es'),
    row('Hub API', 'Shipping Worker', 'Azure Service Bus queue', 'Fire-and-forget command: ShipOrder', 'data', 'queue-command'),
  ],
};

// ── C. resolve-name (scripts/resolve-name.js WHICH) — per-item options: the candidates plus none
const comp = (name, level, description, internal_name = 'Not documented') => [name, { level, system: 'Order Platform', internal_name, description }];
const COMPS = Object.fromEntries([
  comp('Order Desk', 'L2', 'Order Desk is the web front end where clerks capture and track orders.', 'ord-spa-desk'),
  comp('Hub API', 'L2', 'Hub API exposes the order operations to every channel.', 'ord-api-hub'),
  comp('Ledger Store', 'L2', 'Ledger Store is the document database holding orders and their lines.'),
  comp('Notify Worker', 'L2', 'Notify Worker sends order notifications by email and SMS.', 'notify-worker'),
  comp('Edge Gateway', 'L2', 'Edge Gateway routes and secures inbound HTTP traffic.'),
  comp('Identity Hub', 'L2', 'Identity Hub is the corporate OIDC provider that issues tokens to every channel.'),
  comp('order-events', 'L2', 'order-events is the Kafka topic carrying order lifecycle events.'),
  comp('Order Desk Mobile', 'L2', 'Not documented'),
]);
const optsOf = (...names) => ({ ...Object.fromEntries(names.map((n) => [n, COMPS[n]])), none: 'The cell names something that is not among the options: an external party without a descriptor, a team or a person, a protocol (HTTPS, gRPC, JDBC) named in place of a component, or a phrase too generic to be one of them. Never `none` when an option carries the name the cell uses.' });
const ALL = Object.keys(COMPS);
const cell = (c, context, label, mode, names = ALL) => ({ state: { cell: c, context }, options: optsOf(...names), label, mode });
SITES.resolve = {
  spec: { id: 'resolve-name', type: 'choice', hi: 0.6, lo: 0.35,
    question: 'Which option is the documented component that `item.cell` names as the endpoint of the integration described in `item.context`? When the cell names more than one component, pick the one it names first. A word that qualifies the component (a collection, a region, a version in parentheses) still names that component. Every option is a documented component of this architecture, a topic, a queue or a store included; pick the option the cell names even when its description reads "Not documented".' },
  cases: [
    cell('Ledger Store (orders collection)', 'I-05 Hub API writes the order', 'Ledger Store', 'qualifier'),
    cell('Hub API via Edge Gateway', 'I-03 Order Desk submits the order', 'Hub API', 'transport'),
    cell('Corporate IdP', 'I-01 Order Desk obtains a token', 'Identity Hub', 'alias-by-description'),
    cell('Payment network (card scheme)', 'I-09 Hub API authorizes the card payment', 'none', 'external'),
    cell('HTTPS', 'I-11 Notify Worker sends the email', 'none', 'protocol'),
    cell('Order Desk y Notify Worker', 'I-12 consumen el evento de pedido', 'Order Desk', 'two-names'),
    cell('notify-worker', 'I-06 consumes order-events', 'Notify Worker', 'internal-name'),
    cell('Equipo de Operaciones', 'I-14 recibe la alerta de conciliación', 'none', 'team'),
    cell('Orders topic', 'I-04 Hub API publishes OrderPlaced', 'order-events', 'alias-topic'),
    cell('the mobile app', 'I-02 clerks capture orders in the field', 'Order Desk Mobile', 'undocumented-option'),
    cell('Hub API (v2, eu-west)', 'I-07 Partner Portal queries order status', 'Hub API', 'qualifier'),
    cell('Central bank switch', 'I-15 Hub API settles the transfer', 'none', 'external'),
  ],
};

// ── D. mitigation-present (scripts/shared/findings.js MITIGATION_PRESENT)
const mit = (cellText, column, finding, lens, label, mode) => ({ state: { cell: cellText, column, finding, lens }, label, mode });
SITES.mitigation = {
  spec: { id: 'mitigation-present', type: 'noul', hi: 0.6,
    question: 'Does `item.cell` — the `item.column` cell of the finding `item.finding` (lens `item.lens`) — state that the mitigation that column asks for exists now, in whole or in part?',
    criteria: {
      true: 'The mitigation exists now, wholly or partly ("Partial" / "Parcial" alone counts): an implemented mechanism, a running process, a configured limit, a deployed safeguard, a fallback that takes over; for a Vendor Lock-in "Exit path" cell, a named alternative and what migrating to it takes; for a Tech Debt "Replacement implemented" cell, a replacement that is in place; for a STRIDE "Status" cell, mitigated or accepted; for a Blast Radius "Bulkhead present" cell, a bulkhead, a fallback or an isolation that exists.',
      false: 'Nothing exists now: the cell says none, N/A, not documented, nothing, open, pending; or it reads "Finding" / "Hallazgo" (with or without ⚠️), which marks an open finding, not a mitigation; or the mitigation is planned, proposed, recommended, under evaluation, or "to be" implemented; or the cell only describes the failure\'s effect, a risk or a limitation, and names no mechanism, fallback, exit path or replacement.',
    } },
  cases: [
    mit('Partial', 'Bulkhead present', 'B3 Ledger Store', 'blast-radius', 1, 'bare-partial'),
    mit('Hallazgo ⚠️', 'Backpressure', 'K2-01 Hub API', 'bottleneck', 0, 'finding-marker'),
    mit('Se implementará un bulkhead por cliente en el tercer trimestre.', 'Bulkhead present', 'B1 Hub API', 'blast-radius', 0, 'es-planned'),
    mit('PostgreSQL-compatible engine; migrating means rewriting four stored procedures and the JSON operators.', 'Exit path', 'V2 Ledger Store', 'vendor-lock-in', 1, 'exit-path'),
    mit('Recommended: add a dead-letter queue and a retry budget.', 'Backpressure', 'K1-02 Notify Worker', 'bottleneck', 0, 'recommended'),
    mit('The queue absorbs bursts up to 10,000 messages; producers are throttled at 500 msg/s.', 'Backpressure', 'K1-01 Hub API', 'bottleneck', 1, 'mechanism'),
    mit('None — a failure here stops every payment.', 'Bulkhead present', 'B2 Payment Gateway', 'blast-radius', 0, 'effect-only'),
    mit('Accepted (risk owner: CISO, reviewed quarterly)', 'Status', 'T1-S Order Desk spoofing', 'stride', 1, 'accepted'),
    mit('Under evaluation: a second CDN provider as an alternative.', 'Exit path', 'V1 Edge Gateway', 'vendor-lock-in', 0, 'under-evaluation'),
    mit('Read replicas take over queries if the primary fails (failover about 30 s).', 'Bulkhead present', 'B4 Ledger Store', 'blast-radius', 1, 'fallback'),
    mit('No existe aislamiento: los hilos del pool son compartidos por todos los clientes.', 'Bulkhead present', 'B5 API de Pagos', 'blast-radius', 0, 'es-negation'),
    mit('A single replica handles all traffic; a restart drops in-flight requests.', 'Backpressure', 'K3-01 Pricing Engine', 'bottleneck', 0, 'effect-only'),
  ],
};

// ── E. superseded-claims (skills/architecture-docs/scripts/superseded-claims.js spec)
const sc = (passage, retired, current, label, mode) => ({ state: { passage, retired, current }, label, mode });
const R1 = ['User sessions are stored in Redis with a 30-minute TTL.', 'Sessions are stateless: the Order Desk carries a signed JWT and no server-side session store exists.'];
const R2 = ['The Ledger Store sends the Report Warehouse a nightly batch file.', 'The Report Warehouse receives every Ledger Store change through a CDC stream within seconds.'];
const R3 = ['Orders are stored in Oracle 19c.', 'Orders are stored in PostgreSQL 16 (Ledger Store).'];
SITES.superseded = {
  spec: { id: 'superseded-claims', type: 'noul', hi: 0.75, lo: 0.4,
    question: 'Does `item.passage` state the retired decision in `item.retired` as how the system works now — rather than stating the current decision in `item.current`, or telling the history of how the retired decision was replaced?',
    criteria: { true: 'The passage asserts the retired decision as current design: a reader would believe the system still works the way `item.retired` says.', false: 'The passage states the current decision, says the retired one was replaced or reverted, quotes it as history, or is about something else that happens to share words.' } },
  cases: [
    sc('The Order Desk keeps each user session in Redis; an idle session expires after 30 minutes.', ...R1, 1, 'asserts'),
    sc('Session state moved from Redis to stateless JWTs in v2.0 (ADR-112).', ...R1, 0, 'history'),
    sc('Redis caches catalog entries for five minutes to shield the Catalog Service.', ...R1, 0, 'shared-words'),
    sc('Las sesiones de usuario se guardan en Redis y expiran a los 30 minutos de inactividad.', ...R1, 1, 'es-asserts'),
    sc('Every night at 02:00 the Ledger Store exports a batch file that the Report Warehouse loads.', ...R2, 1, 'asserts'),
    sc('Until v1.4 a nightly batch file fed the Report Warehouse; the CDC stream replaced it.', ...R2, 0, 'history'),
    sc('The reporting batch window runs nightly inside the Report Warehouse to rebuild aggregates.', ...R2, 0, 'shared-words'),
    sc('| Order database | Oracle 19c | Primary store for orders and lines |', ...R3, 1, 'table-cell'),
    sc('La migración desde Oracle 19c a PostgreSQL 16 se completó en la versión 2.0.', ...R3, 0, 'es-history'),
    sc('Oracle 19c licences for the order database are renewed every June.', ...R3, 1, 'implied'),
  ],
};

module.exports = { SITES };
