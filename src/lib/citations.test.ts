import { describe, expect, it } from "vitest";
import { prepareCitations } from "./citations";

const source = (id: number) => ({ id, name: `doc${id}.md`, content: `content ${id}`, score: 0.5 });
const sources = [1, 2, 3, 4, 5].map(source);

describe("prepareCitations", () => {
  it("renumbers citations in order of appearance", () => {
    const { text, cited } = prepareCitations("A claim [3]. Another claim [2].", sources);
    expect(text).toBe("A claim [1](#cite-1). Another claim [2](#cite-2).");
    expect(cited.map((c) => [c.label, c.id])).toEqual([
      [1, 3],
      [2, 2],
    ]);
  });

  it("reuses the label when the same excerpt is cited twice", () => {
    const { text, cited } = prepareCitations("One [4]. Two [4]. Three [1].", sources);
    expect(text).toBe("One [1](#cite-1). Two [1](#cite-1). Three [2](#cite-2).");
    expect(cited).toHaveLength(2);
  });

  it("handles adjacent citations", () => {
    const { text } = prepareCitations("Both agree [2][5].", sources);
    expect(text).toBe("Both agree [1](#cite-1)[2](#cite-2).");
  });

  it("leaves markers that match no excerpt untouched", () => {
    const { text, cited } = prepareCitations("Made up [9]. Real [1].", sources);
    expect(text).toBe("Made up [9]. Real [1](#cite-1).");
    expect(cited.map((c) => c.id)).toEqual([1]);
  });

  it("returns no sources when there are no citations or no excerpts", () => {
    expect(prepareCitations("No citations here.", sources).cited).toEqual([]);
    expect(prepareCitations("Claim [1].", []).text).toBe("Claim [1].");
  });
});
