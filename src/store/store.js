import { configureStore } from "@reduxjs/toolkit";
import { sheetApi } from "./sheetApi";

export const store = configureStore({
  reducer: {
    [sheetApi.reducerPath]: sheetApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sheetApi.middleware),
});
