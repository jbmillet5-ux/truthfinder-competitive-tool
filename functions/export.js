export async function onRequestPost() {
  return new Response("category,value\nsample,test", {
    headers: {
      "Content-Type":"text/csv",
      "Content-Disposition": 'attachment; filename="truthfinder_action_plan.csv"'
    }
  });
}