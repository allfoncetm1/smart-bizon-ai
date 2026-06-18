import axios from "axios";

const TOKEN = "HmGsnPUWfGeBXXi3wU-ffeSQNshDI-fMlS7rshvUbMMgrQ8snvL-Gfe";
const PROJECT_ID = "175423";
const BASE = `https://online.bizon365.ru/api/v2/${PROJECT_ID}`;

const client = axios.create({
  baseURL: BASE,
  headers: { "X-Token": TOKEN },
  timeout: 15000,
});

async function test() {
  console.log("Проверяю подключение к Bizon365...\n");
  try {
    const { data } = await client.get("/reports/getlist", {
      params: { limit: 10 },
    });
    console.log(`Успех! Найдено вебинаров: ${data.count}`);
    if (data.list && data.list.length > 0) {
      console.log("\nПоследние вебинары:");
      data.list.forEach((w, i) => {
        console.log(`  ${i + 1}. [${w.webinarId}] ${w.name} — ${w.viewers} зрителей | ${w.type} | ${new Date(w.created).toLocaleDateString("ru-RU")}`);
      });
    } else {
      console.log("Вебинаров пока нет.");
    }
  } catch (err) {
    if (err.response) {
      console.error("Ошибка API:", err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error("Ошибка сети:", err.message);
    }
  }
}

test();
