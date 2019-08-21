/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Oren Zakay.
 */

module.exports = { master_public_address: process.env.hasOwnProperty('master_public_address') ? process.env.master_public_address : 'GCUOZGHMN7XEGIDDCKDXWP732E2GKCYTBPSLY7PPJLDVBIBSKZUVPYTB',
                   master_seed: process.env.hasOwnProperty('master_seed') ? process.env.master_seed : 'SC2RWEIWGJNKULQXSGM5J37RP3N5U6LHDURIHE6NBG5X6XOSIHBMMTQS',
                   appId: 'bkin',
                   board_width: process.env.hasOwnProperty('board_width') ? parseInt(process.env.board_width) : 4,
                   board_height: process.env.hasOwnProperty('board_height') ? parseInt(process.env.board_height) : 5,
                   monitor_tables: process.env.hasOwnProperty('monitor_tables') ? parseInt(process.env.monitor_tables) : false,
                   monitor_tables_interval: process.env.hasOwnProperty('monitor_tables_interval') ? parseInt(process.env.monitor_tables_interval) : 2000,
                   game_fee: process.env.hasOwnProperty('game_fee') ? parseFloat(process.env.game_fee) : 1,
                   bad_card_symbol_index: 1,
                   total_bad_card_pairs: 1,
                   flipped_card_symbol_index: 0,
                   transaction_experation_in_sec: 10,
                   pre_result_timeout:200,
                   result_timout:2000
                }
