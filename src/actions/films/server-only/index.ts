import { generateCachedEmbedding } from "@/actions/embedding";
import { createClient } from "@/lib/supabase/server";

// TODO: pagination for getFavorites, findSimilarMovies
export async function getFavorites(userId: string) {
  try {
    const { data: favorites, error } = await (await createClient())
      .from("Favorite")
      .select("filmId, Movie(*)")
      .eq("userId", userId);

    if (error) {
      console.log(error);
      throw new Error("Error getting favorites");
    }

    return favorites || [];
  } catch {
    return [];
  }
}

export async function getFilmById(id: string) {
  try {
    const { data, error } = await (
      await createClient()
    )
      .from("Movie")
      .select("*")

      .eq("id", id);

    if (error) {
      console.error("Error fetching film by ID:", error);

      return [];
    }

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);

    return [];
  }
}

export async function findSimilarMovies(
  queryVector: number[],
  threshold: number,
  limit: number
) {
  const result = await (
    await createClient()
  ).rpc("match_movie", {
    query_embedding: queryVector,
    similarity_threshold: 0.3,
    match_count: limit,
  });
  if (!result.data) {
    return [];
  }

  return result.data;
}

export async function searchFilmsByText(query: string) {
  if (!query) {
    return [];
  }
  try {
    const vector = await generateCachedEmbedding(query);

    if (vector.length > 0) {
      return await findSimilarMovies(vector, 0.75, 10);
    }
    return [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}
