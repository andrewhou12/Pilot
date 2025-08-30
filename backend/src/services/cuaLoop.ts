import type { Browser, Page } from "playwright";
import { launchBrowser, handleAction, takeScreenshot } from "./playwrightManager.js";
import { sendCUARequest, type AutomationUpdate, type ComputerCallAction } from "./openaiClient.js";

export interface Session {
  id: string;
  browser: Browser;
  page: Page;
  running: boolean;
  lastResponseId?: string;
}

export async function runTask(
  taskText: string,
  onUpdate: (update: AutomationUpdate) => void
) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("about:blank");

  const tools = [
    {
      type: "computer_use_preview",
      display_width: 1024,
      display_height: 768,
      environment: "browser",
    },
  ];

  async function loop(response: any): Promise<void> {
    const calls = response.output.filter((o: any) => o.type === "computer_call");

    if (calls.length === 0) {
      onUpdate({ type: "final_output", data: response.output });
      await browser.close();
      return;
    }

    const call = calls[0];

    if (call.pending_safety_check?.length) {
      onUpdate({ type: "safety_check", data: call.pending_safety_check[0] });
      return; // wait for user approval
    }

    // reasoning summary
    const reasoning = response.output.filter((o: any) => o.type === "summary_text");
    if (reasoning.length) {
      onUpdate({ type: "reasoning", data: reasoning });
    }

    await handleAction(page, call.action as ComputerCallAction);
    await new Promise((r) => setTimeout(r, 1200));

    const screenshotBase64 = await takeScreenshot(page);
    onUpdate({ type: "screenshot", data: screenshotBase64 });

    const next = await sendCUARequest({
      previousResponseId: response.id,
      tools,
      input: [
        {
          type: "computer_call_output",
          call_id: call.call_id,
          output: { type: "input_image", image_url: `data:image/png;base64,${screenshotBase64}` },
        },
      ],
    });

    await loop(next);
  }

  // initial screenshot
  const screenshotBase64 = await takeScreenshot(page);
  onUpdate({ type: "screenshot", data: screenshotBase64 });

  const response = await sendCUARequest({
    input: [
      { type: "input_text", text: taskText },
      { type: "input_image", image_url: `data:image/png;base64,${screenshotBase64}` },
    ],
    tools,
  });

  await loop(response);
}
