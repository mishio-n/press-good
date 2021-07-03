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
  await transitByButtonClick(page, "#area_list a:nth-child(1)");
  // ランキングページ
  await transitByButtonClick(page, "a:nth-child(6) > span");

  // 指定人数 いいね を押す
  await pressGood(page, 10);
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

const transitByButtonClick = async (
  page: Page,
  selector: string,
  navigation = true
) => {
  await page.waitForSelector(selector);
  const buttonElement = await page.$(selector);

  if (!buttonElement) {
    throw new Error(`element of ${selector} is not found`);
  }
  if (navigation) {
    await Promise.all([buttonElement.click(), page.waitForNavigation()]);
  } else {
    await buttonElement.click();
  }
};

const pressGood = async (page: Page, limit: number) => {
  let index = 1;
  while (index <= limit) {
    await transitByButtonClick(
      page,
      `#ranking > div.ranking_list > ul > li:nth-child(${index}) > table > tbody > tr > td:nth-child(4) > div.top_diary > div.top_diary_right > div.top_diary_title > a`
    );

    try {
      // いいね済みは押せないのでスキップ
      // const styleProperty = (await (await (await page.$(
      //   "#added_super_good"
      // ))!.getProperty("style"))!.jsonValue()) as Object;

      const goodButtonElement = await page.$("#iine_done");
      const isPressed = !!goodButtonElement;
      if (isPressed) {
        await Promise.all([page.goBack(), page.waitForNavigation()]);
        index++;
        continue;
      }

      await transitByButtonClick(page, "a.bt_iine", false);
      // await transitByButtonClick(page, "#send_super_good", false);
      await Promise.all([page.goBack(), page.waitForNavigation()]);
    } catch (error) {
      // エラー時も次へ
      console.log(error);
    }
    index++;
  }
};

// entry point
run(url);
