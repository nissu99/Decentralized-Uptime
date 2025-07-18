import express, { Request, Response, NextFunction } from "express";
import { authMiddleware } from "./middleware";
import { prismaClient } from "db/client";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Add basic error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.post("/api/v1/website", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId!;
        const { url } = req.body;

        const data = await prismaClient.website.create({
            data: {
                userId,
                url
            }
        });

        res.json({
            id: data.id
        });
    } catch (error) {
        console.error("Error creating website:", error);
        res.status(500).json({ error: "Failed to create website" });
    }
});

app.get("/api/v1/website/status", authMiddleware, async (req, res) => {
    try {
        const websiteId = req.query.websiteId! as unknown as string;
        const userId = req.userId;

        const data = await prismaClient.website.findFirst({
            where: {
                id: websiteId,
                userId,
                disabled: false
            },
            include: {
                ticks: true
            }
        });

        if (!data) {
            return res.status(404).json({ error: "Website not found" });
        }

        res.json(data);
    } catch (error) {
        console.error("Error fetching website status:", error);
        res.status(500).json({ error: "Failed to fetch website status" });
    }
});

app.get("/api/v1/websites", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId!;

        const websites = await prismaClient.website.findMany({
            where: {
                userId,
                disabled: false
            },
            include: {
                ticks: true
            }
        });

        res.json({
            websites
        });
    } catch (error) {
        console.error("Error fetching websites:", error);
        res.status(500).json({ error: "Failed to fetch websites" });
    }
});

app.delete("/api/v1/website/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const websiteId = req.body.websiteId;
        const userId = req.userId!;

        await prismaClient.website.update({
            where: {
                id: websiteId,
                userId
            },
            data: {
                disabled: true
            }
        });

        res.json({
            message: "Deleted website successfully"
        });
    } catch (error) {
        console.error("Error deleting website:", error);
        res.status(500).json({ error: "Failed to delete website" });
    }
});

// Add health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/v1/`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await prismaClient.$disconnect();
    process.exit(0);
});