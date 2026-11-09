<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use RocketTheme\Toolbox\Event\Event;
use Throwable;

/**
 * Image Redim — visual image resizing in the Admin 2 Markdown editor.
 *
 * Admin 2 is a single-page app that does not load plugin assets through Twig.
 * The script is therefore registered as an invisible floating widget
 * (autoLoad, showFab: false) scoped to the Pages screens. It then attaches to
 * the page's CodeMirror editor and rewrites the image Markdown, for example
 * ![alt](photo.jpg?resize=600). Image processing is done by Grav's own media
 * actions.
 *
 * Loaded file: admin-next/widgets/image-redim.js
 */
class ImageRedimPlugin extends Plugin
{
    /** Interface strings sent to the widget, translated in the admin language. */
    private const STRINGS = [
        'trigger', 'close', 'drag', 'width', 'height', 'proportions',
        'mode_resize', 'mode_cropresize', 'mode_html',
        'original', 'unknown_size', 'upscale', 'no_preview',
        'reset', 'apply', 'changed',
    ];

    public static function getSubscribedEvents(): array
    {
        return [
            'onApiFloatingWidgets' => ['onApiFloatingWidgets', 0],
        ];
    }

    public function onApiFloatingWidgets(Event $event): void
    {
        $widgets = $event['widgets'] ?? [];

        $widgets[] = [
            'id'       => 'image-redim',
            'plugin'   => 'image-redim',
            'label'    => 'Image Redim',
            'icon'     => 'image',
            'priority' => 0,
            'autoLoad' => true,        // load the script without a click
            'showFab'  => false,       // no floating button
            'routes'   => ['/pages'],  // only on the Pages screens
            'config'   => [
                'mode'       => (string) $this->config->get('plugins.image-redim.mode', 'resize'),
                'lock_ratio' => (bool) $this->config->get('plugins.image-redim.lock_ratio', true),
                'strings'    => $this->strings($event['user'] ?? null),
            ],
        ];

        $event['widgets'] = $widgets;
    }

    /**
     * Widget strings in the user's admin language, English as fallback.
     *
     * @param mixed $user
     * @return array<string, string>
     */
    private function strings($user): array
    {
        $languages = $this->languageChain($this->adminLanguage($user));
        $translator = $this->grav['language'];

        $strings = [];
        foreach (self::STRINGS as $name) {
            $key = 'PLUGIN_IMAGE_REDIM.' . strtoupper($name);
            $value = $translator->translate($key, $languages);
            if (is_string($value) && $value !== '' && $value !== $key) {
                $strings[$name] = $value;
            }
        }

        return $strings;
    }

    /**
     * Admin language chosen by the user in Admin 2, read the same way as the
     * API plugin does, with safe fallbacks.
     *
     * @param mixed $user
     */
    private function adminLanguage($user): string
    {
        if ($user) {
            try {
                $resolverClass = 'Grav\\Plugin\\Api\\Services\\PreferencesResolver';
                if (class_exists($resolverClass)) {
                    $resolver = new $resolverClass($this->grav);
                    $lang = $resolver->resolve($user, false)['effective']['adminLanguage'] ?? null;
                    if (is_string($lang) && $lang !== '') {
                        return $lang;
                    }
                }
            } catch (Throwable $e) {
                // fall through
            }

            $legacy = method_exists($user, 'get') ? $user->get('language') : null;
            if (is_string($legacy) && $legacy !== '') {
                return $legacy;
            }
        }

        return 'en';
    }

    /**
     * e.g. 'fr-CA' => ['fr-CA', 'fr', 'en']
     *
     * @return array<int, string>
     */
    private function languageChain(string $lang): array
    {
        $primary = strtolower(explode('-', str_replace('_', '-', $lang))[0]);

        return array_values(array_unique([$lang, $primary, 'en']));
    }
}
