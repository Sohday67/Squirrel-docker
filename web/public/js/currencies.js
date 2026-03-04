/* Currencies - Full list of ISO 4217 currencies */
const Currencies = (() => {
    const list = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
        { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
        { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
        { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
        { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
        { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
        { code: 'THB', name: 'Thai Baht', symbol: '฿' },
        { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
        { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
        { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
        { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
        { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
        { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
        { code: 'CLP', name: 'Chilean Peso', symbol: 'CL$' },
        { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
        { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
        { code: 'COP', name: 'Colombian Peso', symbol: 'CO$' },
        { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
        { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
        { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.' },
        { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
        { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
        { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
        { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
        { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
        { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
        { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
        { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
        { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
        { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
        { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
        { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr' },
        { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
        { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
        { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
        { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
        { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA' },
        { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
        { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
        { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
        { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
        { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
        { code: 'XOF', name: 'West African CFA', symbol: 'CFA' },
        { code: 'XAF', name: 'Central African CFA', symbol: 'FCFA' },
        { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
        { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
        { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
        { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
        { code: 'NPR', name: 'Nepalese Rupee', symbol: 'NRs' },
        { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮' },
        { code: 'KZT', name: 'Kazakh Tenge', symbol: '₸' },
        { code: 'UZS', name: 'Uzbek Sum', symbol: "so'm" },
        { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
        { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
        { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br' },
        { code: 'MDL', name: 'Moldovan Leu', symbol: 'L' },
        { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
        { code: 'RSD', name: 'Serbian Dinar', symbol: 'din' },
        { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
        { code: 'BAM', name: 'Bosnia Mark', symbol: 'KM' },
        { code: 'GIP', name: 'Gibraltar Pound', symbol: '£' },
        { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
        { code: 'TTD', name: 'Trinidad Dollar', symbol: 'TT$' },
        { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$' },
        { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$' },
        { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$' },
        { code: 'GYD', name: 'Guyanese Dollar', symbol: 'GY$' },
        { code: 'SRD', name: 'Surinamese Dollar', symbol: 'SR$' },
        { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
        { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
        { code: 'CUP', name: 'Cuban Peso', symbol: '₱' },
        { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
        { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
        { code: 'NIO', name: 'Nicaraguan Cordoba', symbol: 'C$' },
        { code: 'CRC', name: 'Costa Rican Colon', symbol: '₡' },
        { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
        { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
        { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲' },
        { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs' },
        { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs.S' },
        { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ' },
        { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
        { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$' },
        { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
        { code: 'WST', name: 'Samoan Tala', symbol: 'WS$' },
        { code: 'TOP', name: 'Tongan Paanga', symbol: 'T$' },
        { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$' },
        { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
        { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SRe' },
        { code: 'MUR', name: 'Mauritian Rupee', symbol: 'MRe' },
        { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
        { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
        { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
        { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
        { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
        { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
        { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'E' },
        { code: 'LSL', name: 'Lesotho Loti', symbol: 'M' },
        { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
        { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
        { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu' },
        { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
        { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk' },
        { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
        { code: 'GNF', name: 'Guinean Franc', symbol: 'FG' },
        { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$' },
        { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le' },
        { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh' },
        { code: 'SDG', name: 'Sudanese Pound', symbol: 'LS' },
        { code: 'SSP', name: 'South Sudanese Pound', symbol: 'SS£' },
        { code: 'STN', name: 'Sao Tome Dobra', symbol: 'Db' },
        { code: 'CVE', name: 'Cape Verdean Escudo', symbol: 'Esc' },
        { code: 'KMF', name: 'Comorian Franc', symbol: 'CF' },
        { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar' },
        { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM' },
        { code: 'YER', name: 'Yemeni Rial', symbol: '﷼' },
        { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د' },
        { code: 'LBP', name: 'Lebanese Pound', symbol: 'L£' },
        { code: 'SYP', name: 'Syrian Pound', symbol: '£S' },
        { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD' },
        { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
        { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
        { code: 'KGS', name: 'Kyrgyz Som', symbol: 'сом' },
        { code: 'TJS', name: 'Tajik Somoni', symbol: 'SM' },
        { code: 'TMT', name: 'Turkmen Manat', symbol: 'T' },
        { code: 'KPW', name: 'North Korean Won', symbol: '₩' },
        { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
        { code: 'XAU', name: 'Gold (troy oz)', symbol: 'XAU' },
        { code: 'XAG', name: 'Silver (troy oz)', symbol: 'XAG' },
    ];

    function getAll() {
        return list;
    }

    function getByCode(code) {
        return list.find(c => c.code === code) || { code, name: code, symbol: code };
    }

    function getSymbol(code) {
        return getByCode(code).symbol;
    }

    function format(amount, code) {
        const currency = getByCode(code);
        const num = parseFloat(amount);
        if (isNaN(num)) return `${currency.symbol}0.00`;
        const decimals = ['JPY','KRW','VND','CLP','PYG','VUV','BIF','DJF','GNF','KMF','RWF','XOF','XAF','UGX','ISK','HUF'].includes(code) ? 0 : 2;
        return `${currency.symbol}${num.toFixed(decimals)}`;
    }

    function search(query) {
        const q = query.toLowerCase();
        return list.filter(c =>
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q)
        );
    }

    function renderSelector(id, selectedCode, onChangeAttr) {
        const options = list.map(c =>
            `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''}>${c.code} - ${c.name}</option>`
        ).join('');
        return `<select id="${id}" class="form-control" ${onChangeAttr || ''}>${options}</select>`;
    }

    function renderSearchableSelector(id, selectedCode) {
        const currency = getByCode(selectedCode || 'USD');
        return `
            <div class="currency-search-container" id="${id}-container">
                <input type="text" class="form-control" id="${id}-search"
                    value="${currency.code} - ${currency.name}"
                    onfocus="Currencies.openDropdown('${id}')"
                    oninput="Currencies.filterDropdown('${id}', this.value)"
                    autocomplete="off">
                <input type="hidden" id="${id}" value="${currency.code}">
                <div class="currency-dropdown hidden" id="${id}-dropdown"></div>
            </div>
        `;
    }

    function openDropdown(id) {
        const input = document.getElementById(`${id}-search`);
        input.select();
        filterDropdown(id, '');
        document.getElementById(`${id}-dropdown`).classList.remove('hidden');
        const closeHandler = (e) => {
            if (!document.getElementById(`${id}-container`).contains(e.target)) {
                document.getElementById(`${id}-dropdown`).classList.add('hidden');
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    function filterDropdown(id, query) {
        const results = query ? search(query) : list;
        const dropdown = document.getElementById(`${id}-dropdown`);
        dropdown.innerHTML = results.slice(0, 30).map(c =>
            `<div class="currency-option" onclick="Currencies.selectCurrency('${id}', '${c.code}')">
                <span class="currency-code">${c.code}</span>
                <span>${c.name}</span>
            </div>`
        ).join('');
        dropdown.classList.remove('hidden');
    }

    function selectCurrency(id, code) {
        const currency = getByCode(code);
        document.getElementById(id).value = code;
        document.getElementById(`${id}-search`).value = `${currency.code} - ${currency.name}`;
        document.getElementById(`${id}-dropdown`).classList.add('hidden');
    }

    return { getAll, getByCode, getSymbol, format, search, renderSelector, renderSearchableSelector, openDropdown, filterDropdown, selectCurrency };
})();
