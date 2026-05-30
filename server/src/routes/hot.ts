import { Router } from "express";
import type { HotPlatform, HotSource } from "../../../shared/src/types";
import { createErrorPlatform, hotSources, isHotSource, platformFetchers } from "../services/platforms";

export const hotRouter = Router();

hotRouter.get("/", async (_request, response) => {
  const platforms = await Promise.all(hotSources.map((source) => fetchWithIsolation(source)));
  response.json(platforms);
});

hotRouter.get("/:source", async (request, response) => {
  const { source } = request.params;

  if (!isHotSource(source)) {
    response.status(404).json({ message: "Unknown hot source" });
    return;
  }

  response.json(await fetchWithIsolation(source));
});

async function fetchWithIsolation(source: HotSource): Promise<HotPlatform> {
  try {
    return await platformFetchers[source]();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upstream error";
    return createErrorPlatform(source, message);
  }
}
