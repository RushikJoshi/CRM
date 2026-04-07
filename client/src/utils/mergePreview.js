export const SAMPLE_MERGE_DATA = {
  "{{name}}": "Dhruv",
  "{{email}}": "dhruv@example.com",
  "{{phone}}": "+91 98765 43210",
  "{{company}}": "EduPath Pro",
  "{{course}}": "MBA",
};

export const applySampleMergeData = (value = "") => {
  return Object.entries(SAMPLE_MERGE_DATA).reduce((output, [token, sample]) => {
    return output.split(token).join(sample);
  }, value || "");
};
