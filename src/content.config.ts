
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/content/products',
  }),

  schema: ({ image }) => z.object({
    id: z.string(),
    name: z.string().min(1),
    price: z.number().positive(),
    oldPrice: z.number().positive().nullable(),
    category: z.string().min(1),
    rating: z.number().min(0).max(5),
    badge: z.string().nullable(),
    image: image(),
    description: z.string().min(1),
  }),
});

export const collections = {
  products,
};
