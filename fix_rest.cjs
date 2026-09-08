const fs = require('fs');
let p = './src/pages/admin/DashboardPage.jsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/#212529/g, "var(--text-primary)");
c = c.replace(/rgba\(0,0,0,\.125\)/g, "var(--border-color)");
fs.writeFileSync(p, c);
