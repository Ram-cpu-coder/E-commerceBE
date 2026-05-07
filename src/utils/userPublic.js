/** Strip sensitive fields before sending user data to the client. */
export const toPublicUser = (doc) => {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete o.password;
  delete o.refreshJWT;
  return o;
};
