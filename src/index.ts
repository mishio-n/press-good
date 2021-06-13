import dotenv from "dotenv";
import { launch, Page } from "puppeteer";

dotenv.config();

const url = process.env.TARGET_URL || "";
const id = process.env.ID || "";
const password = process.env.PASSWORD || "";

const run = async (url: string) => {
  const browser = await launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url).then(() => page.waitForTimeout(1000));
  await login(id, password, page);

  // エリア選択
  await transitByButtonClick(page, "#area_list a:nth-child(2)");
  // ランキングページ
  await transitByButtonClick(page, "a:nth-child(6) > span");

  // 指定人数 いいね を押す
  await pressGood(page, 5);
  await page.waitForTimeout(10000);
  await browser.close();
};

const login = async (id: string, password: string, page: Page) => {
  const idElement = await page.$("#txtId");
  const passwordElement = await page.$("#txtPass");
  const loginButton = await page.$("#bt_login");

  if (!idElement || !passwordElement || !loginButton) {
    throw new Error("login failer");
  }

  await idElement.focus();
  await idElement.type(id);

  await passwordElement.focus();
  await passwordElement.type(password);

  await loginButton.click();
};

const transitByButtonClick = async (page: Page, selector: string) => {
  await page.waitForSelector(selector);
  const buttonElement = await page.$(selector);
  if (!buttonElement) {
    throw new Error(`element of ${selector} is not found`);
  }

  await buttonElement.click();
};

const pressGood = async (page: Page, limit: number) => {
  let index = 1;
  while (true) {
    await transitByButtonClick(
      page,
      `.gyousyu_color:nth-child(${index}) .top_diary_right a`
    );
    try {
      await transitByButtonClick(page, "add_super_good");
      await transitByButtonClick(page, "send_super_good");
      await page.goBack();
    } catch (error) {
      // エラー時も次へ
      console.log(error);
    }
    index++;
    if (index === limit) {
      break;
    }
  }
};

// entry point
run(url);
