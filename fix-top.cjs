const fs = require('fs');
let content = fs.readFileSync('src/pages/CongViec.jsx', 'utf8');

const missingImports = `import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, X, Check, AlertTriangle, Settings2 } from "lucide-react";
import LoadingState from "../components/LoadingState";
import ConfirmModal from "../components/ConfirmModal";
import { isConfigured } from "../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../store/sheetApi";
`;

content = missingImports + content;
fs.writeFileSync('src/pages/CongViec.jsx', content);
