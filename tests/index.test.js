/**
 * @jest-environment jsdom
 */
import { YouTubePlayer } from "../src/index"

const TEST_VIDEO_ID = "dQw4w9WgXcQ";

test('attaches to a DOM node', () => {
  const div = document.createElement("div")
  div.setAttribute("id", "player");
  const player = new YouTubePlayer(div);
  expect(player.getState()).toBe("unstarted")
});

test('loads video', () => {
  const div = document.createElement("div")
  div.setAttribute("id", "player");
  const player = new YouTubePlayer(div);
  player.load(TEST_VIDEO_ID);
  expect(player.videoId).toBe(TEST_VIDEO_ID)
});