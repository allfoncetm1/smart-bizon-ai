import axios from "axios";

const TOKEN = "HmGsnPUWfGeBXXi3wU-ffeSQNshDI-fMlS7rshvUbMMgrQ8snvL-Gfe";
const PROJECT_ID = "175423";
const BASE = `https://online.bizon365.ru/api/v2/${PROJECT_ID}`;

const client = axios.create({
  baseURL: BASE,
  headers: { "X-Token": TOKEN },
  timeout: 20000,
});

async function test() {
  const { data: list } = await client.get("/reports/getlist", { params: { limit: 3 } });
  const webinarId = list.list[0].webinarId;

  const { data: report } = await client.get("/reports/get", { params: { webinarId } });
  const inner = report.report;

  // messages — объект или массив?
  const msgs = inner.messages;
  console.log("messages тип:", typeof msgs, Array.isArray(msgs));
  const msgValues = Array.isArray(msgs) ? msgs : Object.values(msgs);
  console.log("messages кол-во:", msgValues.length);
  console.log("Пример сообщения:", JSON.stringify(msgValues[0], null, 2));

  // messagesTS
  const mts = inner.messagesTS;
  console.log("\nmessagesTS тип:", typeof mts, Array.isArray(mts));
  const mtsValues = Array.isArray(mts) ? mts : Object.values(mts);
  console.log("messagesTS кол-во:", mtsValues.length);
  console.log("Пример messagesTS:", JSON.stringify(mtsValues[0], null, 2));

  // getviewers
  console.log("\n=== Viewer ===");
  const { data: vdata } = await client.get("/reports/getviewers", {
    params: { webinarId, skip: 0, limit: 2 },
  });
  console.log("total:", vdata.total);
  const v = vdata.viewers[0];
  console.log("viewer fields:", Object.keys(v));
  console.log("view:", v.view, "viewTill:", v.viewTill);
  console.log("username:", v.username, "phone:", v.phone);
  console.log("city:", v.city, "country:", v.country);
  console.log("buttons:", JSON.stringify(v.buttons));
  console.log("cv (покупки?):", JSON.stringify(v.cv));
  console.log("p1/p2/p3 (utm?):", v.p1, v.p2, v.p3);
}

test().catch(console.error);
