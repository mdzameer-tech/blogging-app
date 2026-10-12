const { Schema, model } = require("mongoose");

const blogVersionSchema = new Schema(
  {
    blogId: { type: Schema.Types.ObjectId, ref: "blog", index: true },
    body: { type: String, required: true },
    savedBy: { type: Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

module.exports = model("blogVersion", blogVersionSchema);
