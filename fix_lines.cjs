const fs = require('fs');

function fix(p) {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/import React\n\{ useMemo, useState \} from 'react';/, "import React, { useMemo, useState } from 'react';\nimport { useTranslation } from 'react-i18next';");
  
  c = c.replace(/import React;\nimport \{ useTranslation \} from 'react-i18next';, \{ useState, useMemo \} from 'react';/, "import React, { useState, useMemo } from 'react';\nimport { useTranslation } from 'react-i18next';");
  
  fs.writeFileSync(p, c);
}

fix('./src/pages/admin/ProfitPage.jsx');
fix('./src/pages/admin/CrmPage.jsx');
