import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
import { test, expect, type Page } from "@playwright/test";
import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { hashPassword } from "../../lib/password";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const tag = `ui_${Date.now()}`,
  password = randomBytes(24).toString("hex");
let tournament = 0;
const form = (page: Page, title: string) =>
  page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
async function login(page: Page, role = "admin") {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(tag + "_" + role);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Esports Tournament & Player Management",
    }),
  ).toBeVisible();
}
async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `docs/screenshots/${name}.png`,
    fullPage: true,
  });
}
test.beforeAll(async () => {
  await mkdir("docs/screenshots", { recursive: true });
  for (const role of ["admin", "viewer"])
    await pool.query(
      "INSERT INTO app_user(username,password_hash,role) VALUES($1,$2,$3)",
      [tag + "_" + role, await hashPassword(password), role],
    );
});
test.afterAll(async () => {
  const fixtures = await pool.query(
    "SELECT tournament_id FROM TOURNAMENT WHERE name=$1",
    [tag + "_cup"],
  );
  for (const { tournament_id: id } of fixtures.rows) {
    await pool.query("DELETE FROM MATCH WHERE tournament_id=$1", [id]);
    await pool.query("DELETE FROM PARTICIPATES_IN WHERE tournament_id=$1", [
      id,
    ]);
    await pool.query("DELETE FROM TOURNAMENT WHERE tournament_id=$1", [id]);
  }
  await pool.query("DELETE FROM TEAM WHERE team_name LIKE $1", [tag + "%"]);
  await pool.query("DELETE FROM PLAYER WHERE username LIKE $1", [tag + "%"]);
  await pool.query("DELETE FROM app_user WHERE username LIKE $1", [tag + "%"]);
  await pool.query("DELETE FROM login_attempt WHERE username LIKE $1", [
    tag + "%",
  ]);
  await pool.end();
});
test("admin completes player roster tournament match result and stats workflow in browser", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await screenshot(page, "01-sign-in");
  await login(page);
  await screenshot(page, "02-dashboard");
  await page.getByRole("link", { name: "Players", exact: true }).click();
  let f = form(page, "Add player");
  await f.getByLabel("Username", { exact: true }).fill(tag + "_player");
  await f.getByLabel("Country", { exact: true }).fill("India");
  await f.getByLabel("Role", { exact: true }).selectOption("Carry");
  await f.getByLabel("Date of birth", { exact: true }).fill("2001-01-01");
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: tag + "_player", exact: true }),
  ).toBeVisible();
  await screenshot(page, "03-players");
  await page.getByRole("link", { name: "Teams", exact: true }).click();
  for (const suffix of ["A", "B"]) {
    f = form(page, "Add team");
    await f.getByLabel("Team name", { exact: true }).fill(tag + "_" + suffix);
    await f.getByLabel("Country", { exact: true }).fill("India");
    await f.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: tag + "_" + suffix, exact: true }),
    ).toBeVisible();
  }
  f = form(page, "Add player to team");
  await f
    .getByLabel("Team", { exact: true })
    .selectOption({ label: tag + "_A" });
  await f
    .getByLabel("Player", { exact: true })
    .selectOption({ label: tag + "_player" });
  await f.getByLabel("Join date", { exact: true }).fill("2026-01-01");
  await f.getByLabel("Status", { exact: true }).selectOption("active");
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: tag + "_player", exact: true }),
  ).toHaveCount(2);
  await screenshot(page, "04-team-roster");
  await page.getByRole("link", { name: "Tournaments", exact: true }).click();
  f = form(page, "Create tournament");
  await f.getByLabel("Tournament name", { exact: true }).fill(tag + "_cup");
  await f
    .getByLabel("Game", { exact: true })
    .selectOption({ label: "Valorant" });
  await f.getByLabel("Start date", { exact: true }).fill("2026-11-01");
  await f.getByLabel("End date", { exact: true }).fill("2026-11-30");
  await f.getByLabel("Prize pool", { exact: true }).fill("1000");
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("link", { name: tag + "_cup", exact: true }).click();
  await expect(page).toHaveURL(/\/tournaments\/\d+$/);
  tournament = Number(new URL(page.url()).pathname.split("/").pop());
  for (const suffix of ["A", "B"]) {
    f = form(page, "Register team for this tournament");
    await f
      .getByLabel("Team", { exact: true })
      .selectOption({ label: tag + "_" + suffix });
    await f.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: tag + "_" + suffix, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "Matches", exact: true }).click();
  f = form(page, "Schedule a match");
  await f
    .getByLabel("Tournament", { exact: true })
    .selectOption({ label: tag + "_cup" });
  await f.getByLabel("Match date", { exact: true }).fill("2026-11-10");
  await f
    .getByLabel("Round (e.g. Quarterfinal)", { exact: true })
    .fill(tag + "_final");
  await f
    .getByLabel("Opponent A (registered team)", { exact: true })
    .selectOption({ label: tag + "_A" });
  await f
    .getByLabel("Opponent B (registered team)", { exact: true })
    .selectOption({ label: tag + "_B" });
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: tag + "_final", exact: true }),
  ).toBeVisible();
  const mid = (
    await pool.query("SELECT match_id FROM MATCH WHERE tournament_id=$1", [
      tournament,
    ])
  ).rows[0].match_id;
  f = form(page, "Record match result");
  await f.getByLabel("Match", { exact: true }).selectOption(String(mid));
  await f
    .getByLabel("Winner", { exact: true })
    .selectOption({ label: tag + "_A" });
  await f
    .getByLabel("Loser", { exact: true })
    .selectOption({ label: tag + "_B" });
  await f.getByLabel("Score (e.g. 13-7)", { exact: true }).fill("13-7");
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("row").filter({
      has: page.getByRole("cell", { name: tag + "_final", exact: true }),
    }),
  ).toContainText("13-7");
  await screenshot(page, "05-match-result");
  await page.getByRole("link", { name: "Stats", exact: true }).click();
  f = form(page, "Record player stats for a match");
  await f.getByLabel("Match", { exact: true }).selectOption(String(mid));
  await f
    .getByLabel("Team", { exact: true })
    .selectOption({ label: tag + "_A" });
  await f
    .getByLabel("Player", { exact: true })
    .selectOption({ label: tag + "_player" });
  for (const [name, value] of Object.entries({
    Kills: "28",
    Deaths: "7",
    Assists: "6",
    Damage: "2200",
    "Rating (e.g. 1.10)": "1.3",
  }))
    await f.getByLabel(name, { exact: true }).fill(value);
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("row").filter({
      has: page.getByRole("cell", { name: tag + "_player", exact: true }),
    }),
  ).toContainText("28");
  await screenshot(page, "06-player-statistics");
  await page.goto(`/tournaments/${tournament}`);
  await expect(
    page
      .getByRole("table")
      .first()
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", { name: tag + "_A", exact: true }),
      }),
  ).toContainText("3");
  await screenshot(page, "07-calculated-standings");
  await page.goto(`/leaderboard?tournament=${tournament}`);
  await expect(
    page.getByRole("cell", { name: tag + "_player", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Served from Redis", { exact: true }),
  ).toBeVisible();
  await screenshot(page, "08-redis-leaderboard");
  await page.goto("/matches");
  f = form(page, "Record match result");
  await f.getByLabel("Match", { exact: true }).selectOption(String(mid));
  await f
    .getByLabel("Winner", { exact: true })
    .selectOption({ label: "Phoenix Rising" });
  await f
    .getByLabel("Loser", { exact: true })
    .selectOption({ label: tag + "_B" });
  await f.getByLabel("Score (e.g. 13-7)", { exact: true }).fill("13-7");
  await f.getByRole("button", { name: "Save", exact: true }).click();
  await expect(f.getByRole("alert")).toContainText("data rule");
  await screenshot(page, "09-invalid-result-rejected");
  expect(errors).toEqual([]);
});
test("viewer can navigate all major pages and cannot mutate through API", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "viewer");
  for (const path of [
    "/players",
    "/teams",
    "/tournaments",
    "/tournaments/1",
    "/matches",
    "/stats",
    "/leaderboard",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toHaveCount(0);
  }
  const response = await page.request.post("/api/players", {
    data: { username: "bypass" },
  });
  expect(response.status()).toBe(403);
  await screenshot(page, "10-viewer-access");
  expect(errors).toEqual([]);
});
test("mobile dashboard navigation stays within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "viewer");
  await screenshot(page, "11-mobile-dashboard");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Teams", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Teams", exact: true }),
  ).toBeVisible();
});
