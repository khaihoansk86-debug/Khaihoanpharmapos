export default function handler(_req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return res.status(410).json({
        error: 'Legacy authentication migration has been retired'
    });
}
