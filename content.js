// YouTubeおよびTwitchプレイヤー上でのホイール操作を監視するイベントリスナー
// イベントの伝播が途中で遮断（stopPropagation）されるのを防ぐため、キャプチャフェーズ（capture: true）でリッスンします
document.addEventListener('wheel', function(event) {
  // 1. YouTubeプレイヤーの判定と処理
  const youtubePlayer = event.target.closest('.html5-video-player');
  if (youtubePlayer) {
    // プレイヤーが音量操作APIを持っているか確認
    if (typeof youtubePlayer.getVolume === 'function' && typeof youtubePlayer.setVolume === 'function') {
      // デフォルトのスクロール動作（ページ全体のスクロールなど）を防止
      event.preventDefault();
      // 他のスクロールイベントハンドラへの伝播を防止
      event.stopPropagation();

      // 現在の音量を取得（0〜100の範囲）
      const currentVolume = youtubePlayer.getVolume();

      // ホイールの回転方向に応じて音量を1%ずつ増減
      let newVolume = currentVolume;
      if (event.deltaY < 0) {
        newVolume = Math.min(100, currentVolume + 1);
      } else if (event.deltaY > 0) {
        newVolume = Math.max(0, currentVolume - 1);
      }

      // ミュート状態の場合は解除
      if (typeof youtubePlayer.isMuted === 'function' && youtubePlayer.isMuted()) {
        if (typeof youtubePlayer.unMute === 'function') {
          youtubePlayer.unMute();
        }
      }

      // 新しい音量を設定
      youtubePlayer.setVolume(newVolume);
    }
    return;
  }

  // 2. Twitchプレイヤーの判定と処理
  const twitchPlayer = event.target.closest('.video-player, [data-a-target="video-player"], [data-a-target="player-legacy-overlay"]');
  if (twitchPlayer) {
    const video = twitchPlayer.querySelector('video');
    if (video) {
      // デフォルトのスクロール動作を防止
      event.preventDefault();
      // 他のスクロールイベントハンドラへの伝播を防止
      event.stopPropagation();

      // 現在の音量を取得（Twitchのvideo.volumeは0.0〜1.0なので、0〜100に変換）
      const currentVolume = Math.round(video.volume * 100);

      // ホイールの回転方向に応じて音量を1%ずつ増減
      let newVolume = currentVolume;
      if (event.deltaY < 0) {
        newVolume = Math.min(100, currentVolume + 1);
      } else if (event.deltaY > 0) {
        newVolume = Math.max(0, currentVolume - 1);
      }

      // ミュート状態の場合は解除
      if (video.muted) {
        video.muted = false;
      }

      // 新しい音量を設定（0.0〜1.0に変換）
      video.volume = newVolume / 100;

      // ── 音量スライダーUIの同期処理 ──
      // Twitchの音量スライダー（input要素）を特定
      const volumeSlider = twitchPlayer.querySelector("input[id^='player-volume-slider-'], [data-a-target='player-volume-slider']");
      if (volumeSlider) {
        // スライダーのmin/max属性値に合わせて設定する値を算出（通常は0.0〜1.0）
        const min = parseFloat(volumeSlider.min) || 0;
        const max = parseFloat(volumeSlider.max) || 1;
        const sliderValue = min + (newVolume / 100) * (max - min);

        // Reactが値の変更を検知できるように、HTMLInputElementプロトタイプのセッターを使用して値を設定
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (typeof nativeInputValueSetter === 'function') {
          nativeInputValueSetter.call(volumeSlider, sliderValue);
        } else {
          volumeSlider.value = sliderValue;
        }

        // inputイベントを発生させてReactに通知し、UI表示を更新させる
        volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    return;
  }
}, { passive: false, capture: true }); // event.preventDefault()を有効にし、かつイベントを横取りするために capture: true を指定
