import { vi } from "vitest";
import { createApp } from "../src/app";

describe("app boot", () => {
  it("mounts canvas UI and starts the loop", () => {
    const mount = document.createElement("div");
    document.body.append(mount);

    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(
        () =>
          ({
            createImageData: (width: number, height: number) =>
              ({ data: new Uint8ClampedArray(width * height * 4), width, height }) as ImageData,
            putImageData: () => undefined,
          }) as unknown as CanvasRenderingContext2D,
      );
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    const app = createApp(mount, { search: "" });

    expect(mount.querySelector("canvas")).not.toBeNull();
    expect(raf).toHaveBeenCalled();

    app.destroy();
    getContext.mockRestore();
    raf.mockRestore();
    cancel.mockRestore();
  });
});
