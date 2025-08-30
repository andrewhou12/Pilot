import { chromium, type Browser, type Page } from "playwright";
import type { ComputerCallAction } from "./openaiClient.js";

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--disable-extensions", "--disable-file-system"],
  });
}

export async function handleAction(page: Page, action: ComputerCallAction) {
  switch (action.type) {
    case "click":
      if (action.x !== undefined && action.y !== undefined) {
        await page.mouse.click(action.x, action.y, {
          button: action.button ?? "left",
        });
      }
      break;

    case "scroll":
      await page.mouse.wheel(action.scroll_x ?? 0, action.scroll_y ?? 0);
      break;

    case "keypress":
      if (action.keys) {
        for (const k of action.keys) {
          await page.keyboard.press(k);
        }
      }
      break;

    case "type":
      if (action.text) {
        await page.keyboard.type(action.text);
      }
      break;

    case "wait":
      await new Promise((r) => setTimeout(r, 2000));
      break;

    default:
      console.warn("⚠️ Unhandled action:", action);
  }
}

export async function takeScreenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: "png" });
  return buf.toString("base64");
}
