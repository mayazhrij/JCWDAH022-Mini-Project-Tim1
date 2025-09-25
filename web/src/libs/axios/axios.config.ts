import { BASE_API_URL } from "@/config/app.config";
import axios from "axios";

const axiosInstance = axios.create({
	baseURL: BASE_API_URL,
	headers: { "Content-Type": "application/json" },
	withCredentials: true,
});

const axiosAuthInstance = (token: string) =>
	axios.create({
		baseURL: BASE_API_URL,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		withCredentials: true,
	});

export { axiosInstance, axiosAuthInstance };
