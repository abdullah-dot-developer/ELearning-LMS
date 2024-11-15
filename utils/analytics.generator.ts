import { count } from "console";
import { Document, Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28
    );
    // console.log("end date: ", endDate, "startDate: ", startDate);
    const monthYear = endDate.toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    // console.log("Month year is ", monthYear);
    const count = await model.countDocuments({
      createdAt: {
        $gt: startDate,
        $lt: endDate,
      },
    });
    // console.log("count is ", count);
    last12Months.push({ month: monthYear, count });
  }
  return { last12Months };
}
