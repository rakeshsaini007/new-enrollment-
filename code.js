/**
 * Google Apps Script for School Enrollment Tracker
 * Paste this into a new script at script.google.com
 * 
 * Column Mapping (Sheet "Data"):
 * A: Udise Code (0)
 * B: School Name (1)
 * C: Nyay Panchayat (2)
 * D: School Type (3)
 * E: Class 1 New Enrolled (4)
 * F: Class 2 New Enrolled (5)
 * G: Class 2 Old Enrolled (6)
 * H: Class 3 New Enrolled (7)
 * I: Class 3 Old Enrolled (8)
 * J: Class 4 New Enrolled (9)
 * K: Class 4 Old Enrolled (10)
 * L: Class 5 New Enrolled (11)
 * M: Class 5 Old Enrolled (12)
 * N: Class 6 New Enrolled (13)
 * O: Class 6 Old Enrolled (14)
 * P: Class 7 New Enrolled (15)
 * Q: Class 7 Old Enrolled (16)
 * R: Class 8 New Enrolled (17)
 * S: Class 8 Old Enrolled (18)
 * T: Total New Enrolled (19)
 * U: Total Enrolled (20)
 * V: Timestamp (Optional - 21)
 */

const SHEET_NAME = "Data";

/**
 * Normalizes a string by trimming and replacing multiple spaces with a single space.
 */
function normalizeKey(str) {
  return str.toString().trim().replace(/\s+/g, ' ');
}

function doGet(e) {
  const udiseCode = e.parameter.udiseCode;
  if (!udiseCode) {
    return ContentService.createTextOutput(JSON.stringify({ error: "No UDISE code provided" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet 'Data' not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find record
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === udiseCode.toString()) {
      const result = {};
      headers.forEach((header, index) => {
        // We normalize the key for the JSON response so the React app can easily map it
        result[normalizeKey(header)] = data[i][index];
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: false, message: "School not found" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Normalize payload keys for easy lookup
    const normalizedPayload = {};
    Object.keys(payload).forEach(k => {
      normalizedPayload[normalizeKey(k)] = payload[k];
    });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const udiseCode = normalizedPayload["Udise Code"];

    if (!udiseCode) {
      throw new Error("UDISE Code is missing in payload");
    }

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === udiseCode.toString()) {
        rowIndex = i + 1;
        break;
      }
    }

    const headers = data[0];
    const timestamp = new Date();
    const rowValues = headers.map(header => {
      const nHeader = normalizeKey(header);
      // Auto-fill Timestamp if column exists
      if (nHeader.toLowerCase() === "timestamp") {
        return timestamp;
      }
      return normalizedPayload[nHeader] !== undefined ? normalizedPayload[nHeader] : "";
    });

    if (rowIndex > -1) {
      // Update existing
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: "update" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Append if not found
      sheet.appendRow(rowValues);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: "create" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
