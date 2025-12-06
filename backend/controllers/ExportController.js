const ExcelJS = require('exceljs');
const Bookmark = require('../models/BookmarkModel');

// Export bookmarks to Excel
exports.exportBookmarksToExcel = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userId = req.user._id;
        const bookmarks = await Bookmark.find({ userId: userId });

        if (!bookmarks || bookmarks.length === 0) {
            return res.status(400).json({ error: 'No bookmarks found to export' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bookmarks');
        
        worksheet.columns = [
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'URL', key: 'url', width: 40 },
            { header: 'Image', key: 'image', width: 30 },
            { header: 'Source', key: 'source', width: 20 },
            { header: 'Published At', key: 'publishedAt', width: 20 },
        ];
        
        bookmarks.forEach(b => {
            worksheet.addRow({
                title: b.title || '',
                description: b.description || '',
                url: b.url || '',
                image: b.image || '',
                source: b.source?.name || '',
                publishedAt: b.publishedAt || '',
            });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=bookmarks.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Export to Excel failed:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to export bookmarks to Excel', message: err.message });
        } else {
            res.end();
        }
    }
};
