/**
 * @jest-environment jsdom
 */
import { YouTubePlayer } from "../src/index";

const TEST_VIDEO_ID = "dQw4w9WgXcQ";

test("attaches to a DOM node", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  expect(player.getState()).toBe("unstarted");
});

test("loads video", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.on("ready", () => {
    expect(player.videoId).toBe(TEST_VIDEO_ID);
    expect(player._ready).toBe(true);
  });
  player.load(TEST_VIDEO_ID);
});

test("adds play command to the queue", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.load(TEST_VIDEO_ID);
  player.play();
  expect(player._queue[0]).toStrictEqual(["play", []]);
});

test("adds pause command to the queue", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.load(TEST_VIDEO_ID);
  player.pause();
  expect(player._queue[0]).toStrictEqual(["pause", []]);
});

test("adds stop command to the queue", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.load(TEST_VIDEO_ID);
  player.stop();
  expect(player._queue[0]).toStrictEqual(["stop", []]);
});

test("loads YouTube iframe API", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.on("ready", () => {
    expect(typeof player._api).toBe("object");
    expect(typeof window.onYouTubeIframeAPIReady).toBe("function");
  });
});

test("handles state change", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  const unstartedHandler = jest.fn(() => {
    /* noop */
  });
  const endedHandler = jest.fn();
  player.on("unstarted", unstartedHandler);
  player.on("ended", endedHandler);
  player._onStateChange({ data: -1 });
  player._onStateChange({ data: 0 });
  expect(unstartedHandler).toBeCalled();
  expect(endedHandler).toBeCalled();
});

test("creates player", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.on("ready", () => {
    player._createPlayer(TEST_VIDEO_ID);
    expect(typeof player._player).toBe("object");
  });
});

/*
test("gets video info", () => {
  const div = document.createElement("div");
  div.setAttribute("id", "player");
  document.body.appendChild(div);
  const player = new YouTubePlayer(div);
  player.load(TEST_VIDEO_ID);
  expect(player.getState()).toBe('unstarted');
  expect(player.getVideoName()).toBe({ name: "Rick Astley" });
});
*/
