import { exec, spawn } from "child_process";
import util from "util";
import fs from "fs";
import * as dotenv from "dotenv";
const execute = util.promisify(exec);
dotenv.config();

async function compileRunKSum(sumTarget: number) {
  if (!fs.existsSync("./src/modeler/a.out")) {
    const { stderr } = await execute(
      `g++ k_sum.cpp -L${process.env.GUROBI_LIB_DIR} -lgurobi_c++ -l${process.env.GUROBI_DYLIB_FILE} -I${process.env.GUROBI_INCLUDE_DIR} -std=c++11`,
      {
        cwd: `${process.cwd()}/src/modeler`,
      }
    );
    if (stderr) {
      return "Error on Build";
    }
  }
  return new Promise((resolve) => {
    let res = "";
    const child = spawn(`./a.out`, {
      cwd: `${process.cwd()}/src/modeler`,
    });
    child.stdout.on("data", (data) => {
      res = data.toString();
    });
    child.on("close", () => {
      resolve(res);
    });
    child.stdin.write(String(sumTarget));
    child.stdin.end();
  });
}

export async function runModeler(avgFloat: number) {
  const summation = avgFloat * 10;
  const res = String(await compileRunKSum(summation));
  if (res === "Error on Build") {
    throw new Error("Error on Build");
  }
  if (res === "Could not obtain a solution!") {
    throw new Error("No Solutions In Range");
  }
  const indexes = res.trim().split(" ");
  if (indexes.length != 10) {
    throw new Error("Unknown Error Parsing Output");
  }
  return indexes;
}
