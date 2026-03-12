import XLSX from "xlsx";

/**
 * Parses an Excel file and returns an array of JSON objects.
 * @param {string} uri - The local URI of the file to parse.
 * @returns {Promise<Array>} - A promise that resolves to an array of objects representing the rows.
 */
export const parseStudentExcel = async (uri) => {
    try {
        const b = await fetch(uri);
        const blob = await b.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const wb = XLSX.read(data, { type: "array" });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(ws);
                    resolve(rows);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(blob);
        });
    } catch (error) {
        throw new Error("Failed to read Excel file: " + error.message);
    }
};
