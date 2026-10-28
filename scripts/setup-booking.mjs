import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
if (existsSync(join(root, '.env.local'))) process.loadEnvFile(join(root, '.env.local'));
const dir = resolve(process.env.BOOKING_DATA_DIR || join(root, ".local"));
const configPath = resolve(process.env.BOOKING_CONFIG_PATH || join(root, "config", "booking.json"));
mkdirSync(dir, { recursive: true, mode: 0o700 });
const target = join(dir, "staff.json");
if (existsSync(target)) { console.log("Доступ уже настроен. Для ротации удалите .local/staff.json вручную и запустите команду снова."); process.exit(0); }
const config = JSON.parse(readFileSync(configPath, "utf8").replace(/^\uFEFF/, ''));
const password = randomBytes(15).toString("base64url");
const salt = randomBytes(16).toString("hex");
const admin = { username: "admin", name: "Администратор", role: "admin", salt, passwordHash: scryptSync(password, salt, 64).toString("hex") };
const users = [admin];
const masterPasswords = [];
for (const [index, master] of config.masters.entries()) {
  const masterPassword = randomBytes(15).toString("base64url");
  const masterSalt = randomBytes(16).toString("hex");
  users.push({ username: "master-" + (index + 1), name: master.name, role: "master", masterId: master.id, salt: masterSalt, passwordHash: scryptSync(masterPassword, masterSalt, 64).toString("hex") });
  masterPasswords.push([master.name, masterPassword]);
}
writeFileSync(target, JSON.stringify({ users }, null, 2), { mode: 0o600 });
if (process.platform !== "win32") chmodSync(target, 0o600);
const accessPath = join(dir, "staff-access.txt");
const lines = ["МУС · Локальный доступ к кабинету", "Сохраните этот файл вне сайта. Удалите его после передачи доступов.", "", "Администратор", "Логин: admin", "Пароль: " + password, "", "Мастера"];
for (const [index, [name, pass]] of masterPasswords.entries()) lines.push(`${name}: логин master-${index + 1}; пароль ${pass}`);
writeFileSync(accessPath, lines.join("\n") + "\n", { mode: 0o600 });
if (process.platform !== "win32") chmodSync(accessPath, 0o600);
console.log("Доступ создан. Локальные данные сохранены в .local/staff-access.txt.");
console.log("После передачи паролей удалите этот файл или храните его в защищённом месте.");
