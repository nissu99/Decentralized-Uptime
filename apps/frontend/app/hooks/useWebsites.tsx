"use client";
import { BACKEND_URL } from "@/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";

interface Website {
    id: string;
    url: string;
    ticks: {
        id: string;
        createdAt: string;
        status: string;
        latency: number;
    }[];
}

export function useWebsites() {
    const { getToken } = useAuth();
    const [websites, setWebsites] = useState<Website[]>([]);

    async function refreshWebsites() {    
        const token = await getToken();
        console.log("Token:", token); // Debugging
        const url = `${BACKEND_URL}/api/v1/websites`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: token,
                },
            });

            console.log("Websites response:", response.data); // Debugging 
            setWebsites(response.data.websites);
        } catch (error: any) {
            console.error("Error fetching websites:", error);
            // Consider a more user-friendly error display in the UI
        }
    }

    useEffect(() => {
        refreshWebsites();

        const interval = setInterval(() => {
            refreshWebsites();
        }, 1000 * 60 * 1);

        return () => clearInterval(interval);
    }, []);

    return { websites, refreshWebsites };

}