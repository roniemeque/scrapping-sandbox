const puppeteer = require("puppeteer");

const ONTIME_INITIAL_URL =
  "https://ontime.sinclog.com.br/Rastreamentos/Rastreamento";

const SEARCH_TYPE_OPTION = "D";
const SELECTORS = {
  searchType: "#tipoBusca",
  searchValue: "#nroBusca",
  button: ".btn-success",
  trackingLog: ".tracking-detalhe",
  trackingLogTime: ".col-xs-3",
  trackingLogMessage: ".col-xs-9",
};

const extractClearTextContentFromString = (string = "") =>
  string
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ +(?= )/g, "")
    .trim();

const scrapLastResultForCpf = async (cpf) => {
  let browser = null;

  try {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto(ONTIME_INITIAL_URL);

    await page.waitForSelector(SELECTORS.button);

    await page.select(SELECTORS.searchType, SEARCH_TYPE_OPTION);

    await page.type(SELECTORS.searchValue, cpf);

    let navigating = page.waitForNavigation();

    await page.click(SELECTORS.button);

    await navigating;

    await page.waitForSelector(SELECTORS.trackingLogTime);

    const resultRaw = await page.evaluate((selectors) => {
      const [lastResultNode] = Array.from(
        document.querySelectorAll(selectors.trackingLog)
      );

      if (!lastResultNode) return {};

      const time =
        lastResultNode?.querySelector(selectors.trackingLogTime)?.textContent ||
        "";
      const message =
        lastResultNode?.querySelector(selectors.trackingLogMessage)
          ?.textContent || "";

      return {
        time,
        message,
      };
    }, SELECTORS);

    await browser.close();

    return {
      time: extractClearTextContentFromString(resultRaw?.time),
      message: extractClearTextContentFromString(resultRaw?.message),
    };
  } catch (error) {
    console.error(error);
    return {};
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

scrapLastResultForCpf("").then((result) => console.log(result));
