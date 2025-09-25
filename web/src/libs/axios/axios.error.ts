import axios from "axios";

const axiosError = (e: unknown, customMessage: string = "Unexpected error") => {
  if (axios.isAxiosError(e)) {
    console.error("Error:", e);
    throw new Error(customMessage + (e?.response?.data?.error?.message || ""));
  } else {
    console.error("Error:", e);
    throw new Error(
      customMessage + (e instanceof Error ? e.message : String(e)),
    );
  }
};

export default axiosError;
