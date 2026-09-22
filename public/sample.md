# How DocuChat works

DocuChat is a retrieval-augmented generation (RAG) app. Instead of asking a language model to answer from memory, it first finds the passages of your documents that are relevant to the question and gives only those to the model.

## Ingestion

When you upload a file, the server extracts its text. PDFs are parsed with unpdf, while .txt and .md files are read directly. The text is split into chunks of about 1,000 characters with a 150 character overlap, so a sentence cut at a chunk boundary still appears whole in the next chunk. Each chunk is turned into a 768-dimension embedding with Google's Gemini embedding model and stored in Postgres using the pgvector extension.

## Retrieval

When you ask a question, the app embeds the question with the same model and asks Postgres for the five chunks whose embeddings are closest by cosine distance. Only chunks from your own session are searched, so other visitors never see your files. For follow-up questions, the previous question is embedded together with the new one, which keeps short messages such as "and the second one?" meaningful.

## Generation

The five chunks are placed in the prompt as numbered excerpts. The model, Gemini 3.1 Flash-Lite, is told to answer only from those excerpts and to cite them like [1] or [2]. If the answer is not in the excerpts it should say so instead of guessing. The answer is streamed to the browser token by token using the Vercel AI SDK, and the sources it cited are shown under the message.

## Limits of the public demo

Each visitor can keep five documents of up to 4 MB. Documents are deleted after 24 hours. The demo runs on free tiers, so if many people use it at once you may see a message asking you to try again in a minute.
