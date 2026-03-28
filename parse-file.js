import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export const config = { api: { bodyParser: false } };

function extractEmailsFromSheet(workbook) {
  const emails = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    data.forEach((row) => {
      if (Array.isArray(row)) {
        row.forEach((cell) => {
          const val = String(cell || "").trim();
          if (emailRegex.test(val)) emails.push(val);
        });
      }
    });
  });

  return [...new Set(emails)];
}

function extractEmailsFromCSV(content) {
  const emailRegex = /[^\s@,;"'<>\[\]]+@[^\s@,;"'<>\[\]]+\.[^\s@,;"'<>\[\]]+/g;
  const found = content.match(emailRegex) || [];
  return [...new Set(found.filter((e) => e.length < 255))];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = new IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload failed" });

    const file = files.file?.[0] || files.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = file.filepath || file.path;
    const ext = path.extname(file.originalFilename || "").toLowerCase();

    try {
      let emails = [];

      if (ext === ".csv") {
        const content = fs.readFileSync(filePath, "utf8");
        emails = extractEmailsFromCSV(content);
      } else if (ext === ".xlsx" || ext === ".xls") {
        const workbook = XLSX.readFile(filePath);
        emails = extractEmailsFromSheet(workbook);
      } else {
        return res.status(400).json({ error: "Only .csv, .xlsx or .xls files supported" });
      }

      fs.unlinkSync(filePath);
      return res.status(200).json({ emails, count: emails.length });
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse file: " + e.message });
    }
  });
}
