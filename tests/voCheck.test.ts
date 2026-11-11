import { describe, expect, it } from "vitest";
import { checkVo } from "../scripts/lib/voCheck";
import { splitWords } from "../src/lib/text";

describe("checkVo", () => {
  it("passes a faithful transcript, ignoring case and punctuation", () => {
    const script = splitWords("Simpan video ini, dan follow Doktermobil.");
    const heard = splitWords("simpan video ini dan follow doktermobil");
    expect(checkVo(script, heard)).toEqual({ ratio: 1, missing: [] });
  });

  it("accepts numbers written as digits", () => {
    const script = splitWords(
      "Tiap busi memercik dua puluh lima kali per detik.",
    );
    const heard = splitWords("Tiap busi memercik 25 kali per detik.");
    expect(checkVo(script, heard).ratio).toBe(1);
  });

  it("reports words that were not heard", () => {
    const script = splitWords("Tarikan berat, bensin boros.");
    const heard = splitWords("Tarikan berat, boros.");
    expect(checkVo(script, heard)).toEqual({
      ratio: 0.75,
      missing: ["bensin"],
    });
  });

  it("joins a compound whisper split in two", () => {
    const script = splitWords("follow Doktermobil.");
    const heard = splitWords("follow dokter mobil");
    expect(checkVo(script, heard)).toEqual({ ratio: 1, missing: [] });
  });

  it("is not fooled by extra words", () => {
    const script = splitWords("Itu mesin mobilmu");
    const heard = splitWords("eh itu mesin mobilmu ya");
    expect(checkVo(script, heard).ratio).toBe(1);
  });
});
