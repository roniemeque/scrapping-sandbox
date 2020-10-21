const ac = require("@antiadmin/anticaptchaofficial");
const puppeteer = require("puppeteer");

const settings = {
  browserUserAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
  browserViewport: {
    width: 1360,
    height: 900,
  },
  initialPage: "l",
};

const RECAPTCHA_SOLVER_API = "";
const SELECTORS = {
  homeNavLink: `[title="Acompanhe o seu pedido"]`,
  refNumber: "#RefNo",
  dateBirth: "#datetimepicker1",
  recaptchaKey: "[data-sitekey]",
  recaptchaResult: "#g-recaptcha-response",
  submitButton: "[type=submit]",
  resultWrapper: "b",
};

const solveRecaptcha = async (url, key) => {
  try {
    ac.setAPIKey(RECAPTCHA_SOLVER_API);

    const gresponse = await ac.solveRecaptchaV2Proxyless(url, key);

    console.log("g-response: " + gresponse);
    console.log("google cookies:");
    console.log(ac.getCookies());

    return gresponse;
  } catch (error) {
    console.error(error);
  }
};

const scrapIt = async () => {
  let navigating;
  const refNumber = "";
  const dateBirth = "";

  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  console.log("setting viewport");
  await page.setViewport(settings.browserViewport);

  console.log("setting user-agent");
  await page.setUserAgent(settings.browserUserAgent);

  console.log("going to initial page and waiting for link");
  await page.goto(settings.initialPage);
  await page.waitForSelector(SELECTORS.homeNavLink);

  console.log("going to form page");
  navigating = page.waitForNavigation();
  await page.click(SELECTORS.homeNavLink);
  await navigating;

  console.log("filling ref number");
  await page.waitForSelector(SELECTORS.refNumber);
  await page.type(SELECTORS.refNumber, refNumber);

  console.log("filling date of birth");
  await page.waitForSelector(SELECTORS.dateBirth);
  await page.type(SELECTORS.dateBirth, dateBirth);

  console.log("recaptcha: get site-key");
  await page.waitForSelector(SELECTORS.recaptchaKey);
  const key = await page.evaluate(
    (selector) => document.querySelector(selector).dataset.sitekey,
    SELECTORS.recaptchaKey
  );

  console.log("recaptcha: sending to service");
  const solvedHash = await solveRecaptcha(page.url(), key);

  console.log(`recaptcha: filling solved hash: ${solvedHash}`);
  await page.waitForSelector(SELECTORS.recaptchaResult);
  await page.evaluate(
    (selector, solvedHash) =>
      (document.querySelector(selector).value = solvedHash),
    SELECTORS.recaptchaResult,
    solvedHash
  );

  console.log("submitting");
  navigating = page.waitForNavigation();
  await page.click(SELECTORS.submitButton);
  await navigating;

  console.log("fetching result");
  const result = await page.evaluate(
    (selector) =>
      Array.from(document.querySelectorAll(selector)).find((node) =>
        node.textContent.includes("visa")
      ).textContent,
    SELECTORS.resultWrapper
  );

  console.log({ result });

  await page.screenshot({ path: "example.png" });
  await browser.close();
};

scrapIt();
