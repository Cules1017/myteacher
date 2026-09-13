import { createApi } from "@reduxjs/toolkit/query/react";
import { listRows, createRow, updateRow, deleteRow } from "../services/sheetApi";

// Wraps the plain-fetch helpers in services/sheetApi.js as an RTK Query
// baseQuery, so every table's data is cached and shared across pages —
// switching Học sinh <-> Điểm danh doesn't refetch the student list if
// it's still fresh, and a create/update/delete auto-invalidates just the
// affected table's cache instead of every page re-fetching by hand.
async function baseQuery(args) {
  try {
    const { type, table, id, data } = args;
    let result;
    if (type === "list") result = await listRows(table);
    else if (type === "create") result = await createRow(table, data);
    else if (type === "update") result = await updateRow(table, id, data);
    else if (type === "delete") result = await deleteRow(table, id);
    else throw new Error(`Unknown query type: ${type}`);
    return { data: result };
  } catch (error) {
    return { error: { message: error.message } };
  }
}

export const sheetApi = createApi({
  reducerPath: "sheetApi",
  baseQuery,
  tagTypes: ["Rows"],
  endpoints: (builder) => ({
    getRows: builder.query({
      query: (table) => ({ type: "list", table }),
      providesTags: (result, error, table) => [{ type: "Rows", id: table }],
    }),
    createRow: builder.mutation({
      query: ({ table, data }) => ({ type: "create", table, data }),
      invalidatesTags: (result, error, { table }) => [{ type: "Rows", id: table }],
    }),
    updateRow: builder.mutation({
      query: ({ table, id, data }) => ({ type: "update", table, id, data }),
      invalidatesTags: (result, error, { table }) => [{ type: "Rows", id: table }],
    }),
    deleteRow: builder.mutation({
      query: ({ table, id }) => ({ type: "delete", table, id }),
      invalidatesTags: (result, error, { table }) => [{ type: "Rows", id: table }],
    }),
  }),
});

export const {
  useGetRowsQuery,
  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
} = sheetApi;
