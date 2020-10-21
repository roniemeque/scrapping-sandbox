const puppeteer = require("puppeteer");

const BASE_URL = "https://status.ondeestameupedido.com/tracking";
const TRACKED = "";

const SELECTORS = {
  latestTableRow: ".table tbody tr",
};

const extractClearTextContentFromString = (string = "") =>
  string
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ +(?= )/g, "")
    .trim();

const scrapLatest = async (cpf) => {
  let browser = null;

  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    await page.goto(`${BASE_URL}/${TRACKED}`);

    await page.waitForSelector(SELECTORS.latestTableRow);

    const resultRaw = await page.evaluate((selectors) => {
      const latest = document.querySelector(selectors.latestTableRow);

      const [textToTheFarRight] = Array.from(latest.querySelectorAll("td"))
        .map((node) => node.textContent)
        .filter((content) => content)
        .reverse();

      return textToTheFarRight || "";
    }, SELECTORS);

    await browser.close();

    return extractClearTextContentFromString(resultRaw);
  } catch (error) {
    console.error(error);
    return {};
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

scrapLatest().then((result) => console.log(result));
