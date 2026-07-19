import { defineRailway, github, postgres, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "iad" });
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "iad", sizeMB: 5000 });
  const agonServer = service("agon-server", {
    source: github("bradyjaysmith-dre/agon", { branch: "main", rootDirectory: "server", checkSuites: false }),
    replicas: { "iad": 1 },
    env: {
      DATABASE_URL: Postgres.env.DATABASE_URL,
    },
  });

  const agonClient = service("agon-client", {
    source: github("bradyjaysmith-dre/agon", { branch: "main", rootDirectory: "client", checkSuites: false }),
    replicas: { "iad": 1 },
  });

  return project("agon", {
    resources: [Postgres, agonServer, agonClient, postgresVolume],
  });
});
