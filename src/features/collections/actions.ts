"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createCollectionSchema, CreateCollectionInput } from "./schemas";
import { cookies } from "next/headers";

export async function createCollection(input: CreateCollectionInput) {
    const result = createCollectionSchema.safeParse(input);
    if (!result.success) {
        return { error: "Invalid input", details: result.error.format() };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("collections")
        .insert({
            name: input.name,
            description: input.description,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/prompts");
    return { data };
}

export async function getCollections() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("name");
    
    if (error) {
        console.error("Error fetching collections:", error);
        return { data: [] };
    }

    return { data };
}

export async function updateCollection(id: string, input: CreateCollectionInput) {
    const result = createCollectionSchema.safeParse(input);
    if (!result.success) {
        return { error: "Invalid input", details: result.error.format() };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("collections")
        .update({
            name: input.name,
            description: input.description,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/prompts");
    return { error: null };
}

export async function deleteCollection(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id);
    
    if (error) {
        return { error: error.message };
    }

    revalidatePath("/prompts");
    return { error: null };
}

export async function addToCollection(promptId: string, collectionId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("collection_prompts")
        .insert({
            prompt_id: promptId,
            collection_id: collectionId
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/prompts");
    return { error: null };
}

export async function removeFromCollection(promptId: string, collectionId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("collection_prompts")
        .delete()
        .eq("collection_id", collectionId)
        .eq("prompt_id", promptId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/prompts");
    return { error: null };
}