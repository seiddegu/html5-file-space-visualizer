// Author: Lou Montulli
// Derived from example code
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

// start the JQuery interface UI fisheye menu
function startFisheyeMenu()
{
    if(/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())) {
  
        $('#fisheye').Fisheye(
            {
            maxWidth: 80,
            items: 'a',
            itemsText: 'span',
            container: '#fisheyeContainer',
            itemWidth: 80,
            proximity: 0,
            halign : 'center'
            }
        )
    } else {
        $('#fisheye').Fisheye(
            {
            maxWidth: 90,
            items: 'a',
            itemsText: 'span',
            container: '#fisheyeContainer',
            itemWidth: 80,
            proximity: 80,
			valign : 'bottom',
            halign : 'center'
            }
        )
    }
}

