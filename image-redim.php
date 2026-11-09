<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use RocketTheme\Toolbox\Event\Event;

/**
 * Image Redim — redimensionnement visuel des images dans l'éditeur Markdown d'Admin 2.
 *
 * Admin 2 est une application JavaScript qui ne charge pas les assets Twig des plugins.
 * Le script est donc déclaré comme « widget flottant » chargé automatiquement
 * (autoLoad) et sans bouton visible (showFab: false). Il s'accroche ensuite
 * à l'éditeur CodeMirror de la page et réécrit la syntaxe Markdown de l'image,
 * par exemple ![alt](photo.jpg?resize=600). Le traitement de l'image est fait
 * par Grav lui-même (actions média).
 *
 * Fichier chargé : admin-next/widgets/image-redim.js
 */
class ImageRedimPlugin extends Plugin
{
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
            'autoLoad' => true,   // charge le script dès l'ouverture de l'admin
            'showFab'  => false,  // pas de bouton flottant
            'config'   => [
                'mode'       => (string) $this->config->get('plugins.image-redim.mode', 'resize'),
                'lock_ratio' => (bool) $this->config->get('plugins.image-redim.lock_ratio', true),
            ],
        ];

        $event['widgets'] = $widgets;
    }
}
