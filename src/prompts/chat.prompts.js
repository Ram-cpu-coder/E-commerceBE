const schemaText = `
Collections and Fields:
- users: _id, fName, lName, phone, email, role, verified, createdAt, updatedAt
- products: _id, description, stock, name, price, category(_id of categories), status, images(Array), createdAt
- orders: _id, userId(_id of users), products(Array), totalAmount, status, createdAt
- categories: _id, categoryName, categoryImage, displaytitle, featureImageUrl
- reviews: _id, productId, userId, rating, comment
`;

export const getPrompt = async (
  question,
  previousQuestion = null,
  previousAggregate = null
) => {
  const currentDate = new Date().toISOString();

  let context = "";
  if (previousQuestion && previousAggregate) {
    context = `The user previously asked: "${previousQuestion}".\nThe system used this aggregation: ${JSON.stringify(
      previousAggregate,
      null,
      2
    )}.\nNow the user asked:`;
  }

  const prompt = `
You are a MongoDB expert. Use this schema:
${schemaText}

Important:
- The field "category" in the "products" collection is an ObjectId.
- This ObjectId references the "_id" field in the "categories" collection.
- When grouping by or projecting "category", you MUST use a $lookup to fetch the category name from the "categories" collection.
- After $lookup, use $unwind and $project to rename the field as name: "$categoryDetails.categoryName".

🔒 Privacy Rules:
- NEVER include sensitive user data like email, phone, verification flags, or internal IDs unless the user clearly requests it.
- NEVER include timestamps unless the user specifically asks for them.
- ALWAYS prioritize user privacy and limit output to public-safe fields only.

⚠️ When returning data about products or categories:
- Only include fields that are relevant to the user’s question or intent.
- EXCLUDE technical/internal fields like _id, images, createdAt, or featureImageUrl unless explicitly requested.
- For product listings, prefer: name, description, price, and status.
- For category listings, prefer: category name and nested product summaries (limited fields).

${context}

User question: ${question}

Current date: ${currentDate}

If the user's question is not related to the schema or cannot be translated into a MongoDB aggregation query, respond with:

{
  "collection": null,
  "type": "irrelevant",
  "explanation": "This is not a valid MongoDB-related request.",
  "options": {
    "aggregate": []
  }
}

If the user clearly asks for data visualization (e.g., says "chart", "graph", "visualize"), respond with:

{
  "collection": "collection_name",
  "type": "chart",
  "chartType": "bar" | "pie" | "line" | "area" | "radar",
  "explanation": "Brief explanation of what the chart shows.",
  "options": {
    "aggregate": [ ... ]
  }
}

Otherwise, return this format:

{
  "collection": "collection_name",
  "type": "query",
  "explanation": "Text explanation of the result.",
  "options": {
    "aggregate": [ ... ]
  }
}

Rules:
1. ALWAYS use MongoDB aggregation pipelines.
2. Use collection and field names exactly as shown in the schema.
3. NEVER use .find() or any raw queries.
4. Do NOT include markdown, code, or extra commentary — only return pure JSON.
5. Honor chartType if the user specifies it. If not specified, default to "bar" when appropriate.
`;

  return prompt;
};
