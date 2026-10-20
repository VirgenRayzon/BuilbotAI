import assert from "node:assert/strict";
import test from "node:test";
import { getMissingParts, getPrebuiltPartStatuses, type ResolvedPrebuiltPart } from "./prebuilt-utils";
import type { Part, PrebuiltSystem } from "./types";

const part = (id: string, category: Part["category"], stock: number): Part => ({
    id,
    name: id,
    category,
    brand: "Test",
    price: 100,
    stock,
    imageUrl: "",
    specifications: {},
});

const system = (components: PrebuiltSystem["components"]): PrebuiltSystem => ({
    id: "test-build",
    name: "Test build",
    tier: "Mid-Range",
    price: 100,
    imageUrl: "",
    components,
});

test("lists and prioritizes every unavailable component, including excess RAM units", () => {
    const build = system({
        cpu: "cpu",
        gpu: "gpu",
        motherboard: "board",
        ram: ["ram", "ram"],
        storage: [],
        psu: "psu",
        case: "case",
        cooler: "cooler",
    });
    const entries: ResolvedPrebuiltPart[] = [
        { key: "cpu-0", category: "cpu", partId: "cpu", part: part("cpu", "CPU", 1) },
        { key: "gpu-0", category: "gpu", partId: "gpu", part: part("gpu", "GPU", 1) },
        { key: "motherboard-0", category: "motherboard", partId: "board", part: part("board", "Motherboard", 0) },
        { key: "ram-0", category: "ram", partId: "ram", part: part("ram", "RAM", 1) },
        { key: "ram-1", category: "ram", partId: "ram", part: part("ram", "RAM", 1) },
        { key: "psu-0", category: "psu", partId: "psu", part: part("psu", "PSU", 1) },
        { key: "case-0", category: "case", partId: "case", part: part("case", "Case", 1) },
        { key: "cooler-0", category: "cooler", partId: "cooler", part: part("cooler", "Cooler", 1) },
    ];

    assert.deepEqual(getMissingParts(build), ["Storage"]);
    const statuses = getPrebuiltPartStatuses(build, entries);
    assert.deepEqual(statuses.filter(item => item.issue).map(item => [item.name, item.issue]), [
        ["board", "out-of-stock"],
        ["ram", "out-of-stock"],
        ["Storage", "missing"],
    ]);
    assert.deepEqual(statuses.slice(0, 3).map(item => item.name), ["board", "ram", "Storage"]);
});

test("marks an unresolved configured part as missing", () => {
    const build = system({ cpu: "unlisted-cpu" });
    const statuses = getPrebuiltPartStatuses(build, [
        { key: "cpu-0", category: "cpu", partId: "unlisted-cpu", part: null },
    ]);

    assert.equal(statuses[0].name, "unlisted-cpu");
    assert.equal(statuses[0].issue, "missing");
    assert.equal(statuses.some(item => item.name === "Motherboard" && item.issue === "missing"), true);
});
