LW.pages.garden.init = function(params, $scope, $page) {

	var challenge = 'challenge' in params

	this.br_last_leeks = []

	if (challenge) {

		var challenge_type = params.type
		var challengeTarget = 'challenge_target' in params ? params.challenge_target : null

		if (challenge_type == 'leek') {

			_.get('garden/get-solo-challenge/' + challengeTarget + '/' + LW.token(), function(data) {

				$scope.challenge = true
				$scope.garden = null
				$scope.challenge_type = 'leek'
				$scope.target = data.leek
				$scope.challenge_fights = data.challenges

				$page.render()
				LW.setTitle(_.lang.get('garden', 'title'), _.lang.get('garden', 'n_challenges', data.challenges))

				if (_.is_mobile()) {
					$('#garden-page .column3').hide()
					$('#garden-page .column9').show()
				}

				var leeks = []
				for (var l in LW.farmer.leeks) leeks[LW.farmer.leeks[l].id] = LW.farmer.leeks[l]
				leeks[data.leek.id] = data.leek

				$scope.my_leek = $('.myleek').first().attr('leek')
				$('#garden-page .myleek').first().addClass('selected')
				$('#solo-leek').text($('.myleek[leek=' + $scope.my_leek + ']').attr('name'))

				$('.myleek').click(function() {
					var index = $(this).index();
					$('.enemies').hide();
					$($('.enemies')[index]).show();

					$('.myleek').removeClass('selected');
					$(this).addClass('selected');
					$scope.my_leek = $(this).attr('leek');
					$('#solo-leek').text($(this).attr('name'));
				})

				LW.pages.garden.images(leeks)

				$(".leek.enemy").click(function() {

					_.post('garden/start-solo-challenge', {
						leek_id: $scope.my_leek,
						target_id: $(this).attr('leek')
					}, function(data) {
						if (data.success) {
							LW.page('/fight/' + data.fight)
						}
					})
				})
			})
		} else {

			_.get('garden/get-farmer-challenge/' + challengeTarget + '/' + LW.token(), function(data) {

				$scope.challenge = true
				$scope.garden = null
				$scope.target = data.farmer
				$scope.challenge_type = 'farmer'
				$scope.challenge_fights = data.challenges
				$page.render()

				LW.setTitle(_.lang.get('garden', 'title'), _.lang.get('garden', 'n_challenges', data.challenges))

				if (_.is_mobile()) {
					$('#garden-page .column3').hide()
					$('#garden-page .column9').show()
				}

				$(".farmer.enemy").click(function() {

					_.post('garden/start-farmer-challenge', {
						target_id: $(this).attr('farmer')
					}, function(data) {
						if (data.success) {
							LW.page('/fight/' + data.fight)
						}
					})
				})
			})
		}
		return
	}

	_.get('garden/get/' + LW.token(), function(data) {

		$scope.challenge = false
		$scope.garden = data.garden
		$scope.garden.farmer = LW.farmer

		$page.render()

		LW.setTitle(_.lang.get('garden', 'title'), _.lang.get('garden', 'n_fights', LW.farmer.fights))
		LW.setMenuTab('garden')

		// Restore
		$scope.category = 'garden/category' in localStorage ? localStorage["garden/category"] : 'solo'
		$scope.my_leek = 'garden/leek' in localStorage ? localStorage["garden/leek"] : _.first(LW.farmer.leeks).id
		$scope.my_compo = 'garden/compo' in localStorage ? localStorage["garden/compo"] : (
			_.isEmptyObj(data.garden.my_compositions) ? 0 : _.first(data.garden.my_compositions).id)

		if ($('.myleek[leek=' + $scope.my_leek + ']').length == 0) {
			$scope.my_leek = $('.myleek').first().attr('leek')
		}
		if ($('.compo[compo=' + $scope.my_compo + ']').length == 0) {
			$scope.my_compo = $('.compo').first().attr('compo')
		}

		// Tabs
		$('#tab-solo').click(function() {
			LW.page('/garden/solo')
		})
		$('#tab-farmer.enabled').click(function() {
			LW.page('/garden/farmer')
		})
		$('#tab-team.enabled').click(function() {
			LW.page('/garden/team')
		})
		$('#tab-battle-royale.enabled').click(function() {
			LW.page('/garden/battle-royale')
		})
		$('#garden-left .enabled .tooltip').remove()

		// Solo
		$('#garden-page #garden-solo .myleek').click(function() {
			$page.select_leek($(this).attr('leek'))
			$page.load_leek($(this).attr('leek'))
		})
		// BR
		$('#garden-battle-royale .myleek:not(.disabled)').click(function() {
			$page.select_leek($(this).attr('leek'))
		})
		$('#garden-battle-royale #br-select-button').click(function(e) {
			LW.pages.garden.battle_royale_select(e)
		})
		$('#garden-battle-royale #br-return').click(function() {
			LW.pages.garden.battle_royale()
		})

		for (var l in LW.farmer.leeks) {
			$page.leek_image(LW.farmer.leeks[l])
		}

		// Team
		$('.compo').click(function() {
			$page.select_composition($(this).attr('compo'))
		})

		if (!$scope.category && !_.is_mobile()) {
			$scope.category = 'solo'
		}
		if ($scope.category) {
			LW.page('/garden/' + $scope.category)
		} else {
			LW.app.split_show_list()
		}

		LW.pages.garden.time()
	})
}

LW.pages.garden.update = function(params) {
	_.log("update ", params)
	if (params && 'category' in params && params.category) {

		var category = params.category

		_category = category
		localStorage["garden/category"] = _category

		$('.tab').removeClass('active')
		$('#tab-' + category).addClass('active')

		$('#garden-solo').hide()
		$('#garden-farmer').hide()
		$('#garden-team').hide()
		$('#garden-battle-royale').hide()
		$('#garden-' + _category).show()

		var category_underscore = category.replace('-', '_')
		LW.setTitle(_.lang.get('garden', 'garden_' + category_underscore), _.lang.get('garden', 'n_fights', LW.farmer.fights))

		LW.app.split_show_content()

		if (category == 'solo') {
			LW.pages.garden.select_leek(this.scope.my_leek)
			LW.pages.garden.load_leek(this.scope.my_leek)
		}
		if (category == 'farmer') {
			LW.pages.garden.select_farmer()
		}
		if (category == 'team') {
			LW.pages.garden.select_composition(this.scope.my_compo)
		}
		if (category == 'battle-royale') {
			LW.pages.garden.battle_royale()
		}
	} else {
		localStorage["garden/category"] = ''
		LW.setTitle(_.lang.get('garden', 'title'))
		LW.app.split_show_list()
	}
}

LW.pages.garden.back = function() {
	LW.page('/garden')
}

LW.pages.garden.select_leek = function(leek_id) {

	var index = $(this).index()
	$('#garden-solo .enemies').hide()
	$('#garden-solo .enemies[of=' + leek_id + ']').show()

	var element = $('.myleek[leek=' + leek_id + ']')

	$('.myleek').removeClass('selected')
	element.addClass('selected')

	this.scope.my_leek = leek_id
	localStorage["garden/leek"] = leek_id
	$('#solo-leek').text(element.attr('name'))
}

LW.pages.garden.load_leek = function(leek_id) {

	var element = $('.myleek[leek=' + leek_id + ']')

	$('#garden-solo .enemies[of=' + leek_id + '] .no-more-fights').hide()
	if (this.scope.garden.fights == 0) {
		$('#garden-solo .enemies[of=' + leek_id + '] .no-more-fights').show()
		return null
	}

	if (element.attr('loaded')) return null
	element.attr('loaded', true)

	_.get('garden/get-leek-opponents/' + leek_id + '/' + LW.token(), function(data) {
		if (data.success) {

			$('#garden-solo .enemies[of=' + leek_id + '] .no-opponents').hide()
			if (data.opponents.length == 0) {
				$('#garden-solo .enemies[of=' + leek_id + '] .no-opponents').show()
				return null
			}

			var html = ''
			for (var o in data.opponents) {
				html += _.view.render('garden.leek', {leek: data.opponents[o]})
			}
			$('#garden-solo .enemies[of=' + leek_id + '] .opponents').show().html(html)

			$('#garden-solo .enemies[of=' + leek_id + '] .opponents .leek').click(function() {
				_.post('garden/start-solo-fight', {
					leek_id: leek_id,
					target_id: $(this).attr('leek')
				}, function(data) {
					if (data.success) {
						LW.page('/fight/' + data.fight)
						LW.updateFights(-1)
					}
				})
			})
			for (var o in data.opponents) {
				LW.pages.garden.leek_image(data.opponents[o])
			}
		} else {
			$('#garden-solo .enemies[of=' + leek_id + '] .ai-invalid').hide()
			if (data.error == 'invalid_ai') {
				$('#garden-solo .enemies[of=' + leek_id + '] .ai-invalid').show()
				return null
			}
			$('#garden-solo .enemies[of=' + leek_id + '] .no-ai-equipped').hide()
			if (data.error == 'no_ai_equipped') {
				$('#garden-solo .enemies[of=' + leek_id + '] .no-ai-equipped').show()
				return null
			}
			_.toast(data.error)
		}
	})
}

LW.pages.garden.select_farmer = function() {

	$('#garden-farmer .no-more-fights').hide()
	if (this.scope.garden.fights == 0) {
		$('#garden-farmer .no-more-fights').show()
		return null
	}

	if ($('#garden-farmer').attr('loaded')) return null
	$('#garden-farmer').attr('loaded', true)

	_.get('garden/get-farmer-opponents/' + LW.token(), function(data) {
		if (data.success) {

			$('#garden-farmer .no-opponents').hide()
			if (data.opponents.length == 0) {
				$('#garden-farmer .no-opponents').show()
				return null
			}

			var html = ''
			for (var o in data.opponents) {
				html += _.view.render('garden.farmer', data.opponents[o])
			}

			$('#garden-farmer .enemies .opponents').show().html(html)

			$('#garden-farmer .enemies .farmer').click(function() {
				_.post('garden/start-farmer-fight', {
					target_id: $(this).attr('id')
				}, function(data) {
					if (data.success) {
						LW.page('/fight/' + data.fight)
						LW.updateFights(-1)
					}
				})
			})
		} else {
			_.toast(data.error)
		}
	})
}

LW.pages.garden.select_composition = function(compo_id) {

	var index = $(this).index()
	$('#garden-team .enemies').hide()
	$('#garden-team .enemies[of=' + compo_id + ']').show()

	var element = $('.compo[compo=' + compo_id + ']')

	$('.compo').removeClass('selected')
	element.addClass('selected')

	this.scope.my_compo = compo_id
	localStorage["garden/compo"] = compo_id
	$('#my-compo').text(element.attr('name'))

	$('#garden-team .enemies[of=' + compo_id + '] .no-more-fights').hide()
	var compo_array_id = null
	for (var i in LW.pages.garden.scope.garden.my_compositions) {
		if (LW.pages.garden.scope.garden.my_compositions[i].id == compo_id) {
			compo_array_id = i
		}
	}
	if (this.scope.garden.my_compositions[compo_array_id].fights == 0) {
		$('#garden-team .enemies[of=' + compo_id + '] .no-more-fights').show()
		return null
	}

	if (element.attr('loaded')) return null
	element.attr('loaded', true)

	_.get('garden/get-composition-opponents/' + compo_id + '/' + LW.token(), function(data) {
		if (data.success) {

			$('#garden-team .enemies[of=' + compo_id + '] .no-opponents').hide()
			if (data.opponents.length == 0) {
				$('#garden-team .enemies[of=' + compo_id + '] .no-opponents').show()
				return null
			}

			var html = ''
			for (var o in data.opponents) {
				html += "<div class='compo-wrapper'>" + _.view.render('garden.compo', {compo: data.opponents[o]}) + "</div>"
			}
			$('#garden-team .enemies[of=' + compo_id + '] .opponents').show().html(html)

			$('#garden-team .enemies[of=' + compo_id + '] .opponents .compo').click(function() {
				_.post('garden/start-team-fight', {
					composition_id: compo_id,
					target_id: $(this).attr('compo')
				}, function(data) {
					if (data.success) {
						LW.page('/fight/' + data.fight)
					}
				})
			});
		} else {
			_.toast(data.error)
		}
	})
}

LW.pages.garden.images = function(leeks) {

	$('#garden-page .leek').each(function() {
		var id = $(this).attr('leek')
		var leek = leeks[id]
		var elem = this
		LW.createLeekImage(id, 0.8, leek.level, leek.skin, leek.hat, function(id, data) {
			$(elem).find('.image').html(data)
		})
	})
}

LW.pages.garden.leek_image = function(leek) {
	LW.createLeekImage(leek.id, 0.8, leek.level, leek.skin, leek.hat, function(id, data) {
		$('#garden-page .leek[leek=' + id + '] .image').html(data)
	})
}

LW.pages.garden.battle_royale = function() {

	$('#br-select').show()
	$('#br-room').hide()
	$('#br-return').hide()

	$('#br-select .myleek').first().addClass('selected')
}

LW.pages.garden.battle_royale_select = function(e) {

	$('#br-select').hide()
	$('#br-room').show()
	$('#br-return').show()

	var leek = $('#garden-battle-royale .myleek.selected').attr('leek')

	this.br_last_leeks = {}
	$('#garden-battle-royale .leeks').html('')

	LW.battle_royale.register(leek)
}

LW.pages.garden.wsreceive = function(data) {
	var self = this

	if (data.type == BATTLE_ROYALE_UPDATE) {
		var count = data.data[0]
		var leeks = data.data[1]

		$('#garden-battle-royale .count').text(count)

		for (var l in leeks) {
			if (l in this.br_last_leeks) continue

			var html = _.view.render('garden.leek', {leek: leeks[l]})
			$('#garden-battle-royale .leeks').html($('#garden-battle-royale .leeks').html() + html)
			LW.pages.garden.leek_image(leeks[l])
		}
		for (var l in this.br_last_leeks) {
			if (l in leeks) continue
			$('#garden-battle-royale .leek[leek=' + this.br_last_leeks[l].id + ']').remove()
		}
		this.br_last_leeks = leeks
	}
}

LW.pages.garden.time = function() {

	if (this.scope.garden.fights > 0) {
		$('#remaining-fights .on').show()
		$('#remaining-fights .off').hide()
	} else {
		$('#remaining-fights .on').hide()
		$('#remaining-fights .off').show()
	}

	var midnignt = new Date(LW.time.get() * 1000)
	midnignt.setHours(24, 0, 0, 0)

	var timeUntilMidnight = Math.round(midnignt.getTime() / 1000 - LW.time.get())
	var update = null
	this.gardenTimeUpdate = function() {
		timeUntilMidnight--
		if (timeUntilMidnight < 0) {
			$('#remaining-fights .on').show()
			$('#remaining-fights .off').show()
		} else {
			$('.remaining-time').text(FormatTime(timeUntilMidnight))
			setTimeout(update, 1000)
		}
	}
	update = this.gardenTimeUpdate
	this.gardenTimeUpdate()
}
